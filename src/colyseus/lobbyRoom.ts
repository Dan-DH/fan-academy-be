import { AuthContext, Client, Room } from "@colyseus/core";
import { ITurnMessage } from "../interfaces/gameInterface";
import User from "../models/userModel";
import { sanitizeInput } from "../middleware/sanitizeInput";
import { JWT } from "@colyseus/auth";
import { JwtPayload } from "jsonwebtoken";
import { EColyseusMessages } from "../enums/colyseusMessage.enums";
import { LobbyService } from "../services/lobbyService";
import GameService from "../services/gameService";
import { IColyseusOnCreate } from "../interfaces/colyseusInterface";

export class Lobby extends Room {
  // connectedClients: Set<Client> = new Set(); TODO: clean if not needed

  async onJoin(client: Client, options: { userId: string }) {
    (client as any).userId = options.userId; // TypeScript workaround
    this.presence.set(`user:${options.userId}`, 'online');

    console.log(`[Lobby ${this.roomId}] Client joined: ${(client as any).userId}`);
    console.log(`[Lobby ${this.roomId}) Connected clients: ${this.clients}`);

    User.updateOne({ _id: options.userId }, { turnEmailSent: false }, { runValidators: true }); // TODO fnf
  }

  onCreate(_options: { userId: string }): void {
    /**
     * PING
     */
    this.onMessage(EColyseusMessages.PING, (client: Client) => {
      console.log(`Received game ping from user ${(client as any).userId}`);
      this.broadcast(EColyseusMessages.PONG); // TODO: I think it's okay to send to all
    });

    /**
     * GET_GAMELIST
     */
    this.onMessage(EColyseusMessages.GET_GAMELIST, async (client: Client): Promise<void> => {
      const games = await GameService.getCurrentGamesForGameList((client as any).userId);
      client.send(EColyseusMessages.GET_GAMELIST, games); // TODO: one or both of the arrays in games could be empty. Check on FE
    });

    /**
     * CLIENT_TURN_UPDATE
     */
    this.onMessage(EColyseusMessages.CLIENT_TURN_UPDATE, async (client: Client, message: ITurnMessage) => {
      console.log(`Turn sent by client ${(client as any).userId}`);

      if (message.gameOver) {
        await this.handleGameOver(message);
      } else {
        await this.handleTurn(message);
      }
    });

    /**
     * CHAT_MESSAGE
     */
    this.onMessage(EColyseusMessages.CHAT_MESSAGE_SENT, async (client: Client, message: {
      userId: string, // TODO: turn this into the player receiving the message id
      gameId: string, // TODO: get from FE
      message: string,
      token: string // TODO: is this being used?
    }): Promise<void> => {
      console.log(`Chat sent by client ${client.auth._id} in room ${this.roomId}`);
      const sanitizedMessage = sanitizeInput(message.message);

      // Update the chat log on the db, or create one if none exists
      const messageToPush = {
        username: client.auth.username,
        message: sanitizedMessage
      };

      User.updateOne({ _id: message.gameId }, { $push: { chatLog: messageToPush } }); // fnf

      const playerToNotify = this.clients.find(c => (c as any).userId === message.userId);

      if (playerToNotify) playerToNotify.send(EColyseusMessages.CHAT_MESSAGE_RECEIVED, {
        username: client.auth.username,
        message: sanitizedMessage
      });
    });

    /**
     * NEW_GAME_REQUEST
     */
    this.onMessage(EColyseusMessages.NEW_GAME_REQUEST, async (client: Client, message: IColyseusOnCreate): Promise<void> => {
      // TODO: we might not need the new room
      const result = await LobbyService.handleNewGameRequest(message);
    });
    /**
     *
    // TODO:
    // Accessing a game
    // Creating a game -> Includes challenges
          check for games looking for players -> addPlayerTwo
              starting a game
          else gameservice.createGame
    // Starting a game -> includes challenge accepted?
          mewssage player1 if first player
    // Updating an existing game ---> GameService.getColyseusRoom
    // Game ending update
    // Deleting a game / challenge
    // User deleted
    */

    // // Updating on a game ending
    // this.presence.subscribe('gameOverPresence', (message: {
    //   gameId: ObjectId
    //   previousTurn: IGameState[],
    //   userIds: string[],
    //   turnNumber: number,
    //   lastPlayedAt: Date,
    //   gameOver: IGameOver
    // }) => {
    //   // console.log('MESSAGE ->', message);
    //   console.log(`[Lobby ${this.roomId}] Received subscribed gameOverPresence message`);

    //   const clientsToExclude: Client[] = [];
    //   this.connectedClients.forEach(client => {
    //     if (!message.userIds.includes((client as any).userId)) clientsToExclude.push(client);
    //   });

    //   this.broadcast('gameOverUpdate', message, { except: clientsToExclude });
    // });

    // // Deleting a challenge
    // this.presence.subscribe('gameDeletedPresence', (message: {
    //   gameId: ObjectId,
    //   userIds: string[]
    // }) => {
    //   console.log(`[Lobby ${this.roomId}] Received subscribed gameDeletedPresence message`);

    //   const clientsToExclude: Client[] = [];
    //   this.connectedClients.forEach(client => {
    //     if (!message.userIds.includes((client as any).userId)) clientsToExclude.push(client);
    //   });

    //   this.broadcast('gameDeletedUpdate', message, { except: clientsToExclude });
    // });

    // this.onMessage("gameDeletedMessage", async (client: Client, message: {
    //   userId: string,
    //   gameId: string
    // }) => {
    //   console.log('gameDeletedMessage logs', message);
    //   const result = await GameService.deleteGame(message.userId, message.gameId);

    //   this.presence.publish('gameDeletedPresence', {
    //     gameId: message.gameId,
    //     userIds: result
    //   });
    // });

    // this.onMessage("challengeAcceptedMessage", async (client: Client, message: {
    //   userId: string,
    //   gameId: string,
    //   faction: EFaction
    // }) => {
    //   console.log('challengeAcceptedMessage logs', message);
    //   const userId = message.userId ;
    //   const gameId = message.gameId;
    //   const faction = message.faction as EFaction;

    //   if (!userId || !gameId || !faction) throw new CustomError(23);

    //   const game = await GameService.getGame(userId, gameId);
    //   if (!game) throw new CustomError(24);

    //   const result = await GameService.addPlayerTwo(game, faction as EFaction, userId);

    //   const userIds = result?.players.map(player => { return player.userData._id.toString();});
    //   this.presence.publish('newGamePresence', {
    //     game: result,
    //     userIds
    //   });
    // });

    // // Deleting a user
    // this.presence.subscribe('userDeletedPresence', (message: {
    //   userIds: string[],
    //   gameIds: string[]
    // }) => {
    //   console.log(`[Lobby ${this.roomId}] Received subscribed userDeletedPresence message`);
    //   console.log('MESSAGE', message);

    //   const clientsToExclude: Client[] = [];
    //   this.connectedClients.forEach(client => {
    //     if (!message.userIds.includes((client as any).userId)) clientsToExclude.push(client);
    //   });

    //   this.logConnectedClients();
    //   console.log('clientsTOExclude', clientsToExclude);
    //   this.broadcast('userDeletedUpdate', message, { except: clientsToExclude });
    // });

    // // Keep connection alive
    // this.onMessage("ping", (client: Client) => {
    //   console.log(`Received lobby ping from user ${(client as any).userId}`);
    //   this.broadcast('pong');
    // });
  };

  // Handle client leaving
  onLeave(client: Client, _consented: boolean): void {
    console.log(`[Lobby ${this.roomId}] Client left: ${(client as any).userId}`);
    console.log(`[Lobby ${this.roomId}) Connected clients: ${this.clients}`);
  }

  // Handle lobby disposal
  onDispose(): void {
    console.log("[Lobby] Room disposed", this.roomId);
  }

  // Room auth
  static async onAuth(_token: string, options: any, _context: AuthContext): Promise<JwtPayload | boolean> {
    try {
      const user = await JWT.verify(options.token) as JwtPayload;

      if (user) {
        console.log(`User authenticated`, user);
        return user;
      }

      console.log('Authentication failed');
      return false;
    } catch (err) {
      throw new Error("Invalid or expired token");
    }
  }

  /**
   * HANDLING MESSAGES
   */
  async handleGameOver(message: ITurnMessage): Promise<void> {
    const gameOverUpdate = await LobbyService.handleGameOver(message);
    this.broadcast(EColyseusMessages.GAME_OVER, gameOverUpdate);
  }

  async handleTurn(message: ITurnMessage): Promise<void> {
    const isOnline = this.clients.find(c => (c as any).userid === message.newActivePlayer.toString()); // TODO: check if this works // ALSO check why am I sending ObjectIds instead of strings
    const turnUpdate = await LobbyService.handleTurn(message, !!isOnline);

    if (isOnline) isOnline.send(EColyseusMessages.SERVER_TURN_UPDATE, turnUpdate);
  }
}