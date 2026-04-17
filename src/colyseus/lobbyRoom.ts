import { AuthContext, Client, Room } from "@colyseus/core";
import { ITurnMessage } from "../interfaces/gameInterface";
import { JWT } from "@colyseus/auth";
import { JwtPayload } from "jsonwebtoken";
import { EColyseusMessages } from "../enums/colyseusMessage.enums";
import { LobbyService } from "../services/lobbyService";
import GameService from "../services/gameService";
import { IColyseusOnCreate } from "../interfaces/colyseusInterface";
import { EGameStatus } from "../enums/game.enums";
import { CustomError } from "../classes/customError";
import { ObjectId } from "mongoose";
import { EmailService } from "../emails/emailService";
import { recursiveSanitizeInput } from "../middleware/sanitizeInput";
import User from "../models/userModel";

export class Lobby extends Room {
  onJoin(client: Client, options: { userId: string }) {
    (client as any).userId = options.userId; // TypeScript workaround
    this.presence.set(`user:${options.userId}`, 'online');

    console.log(`[Lobby ${this.roomId}] Client joined: ${(client as any).userId}`);
    console.log(`[Lobby ${this.roomId}) Connected clients: ${this.clients}`);

    User.updateOne({ _id: options.userId }, { turnEmailSent: false }, { runValidators: true }); // TODO fnf
  }

  onCreate(_options: { userId: string }): void {
    // FIXME: create message interfaces for all messages
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
      console.log('GET GAMELIST MESSAGE RECEIVED');
      console.log('UserId', (client as any).userId);

      const games = await GameService.getCurrentGamesForGameList((client as any).userId);
      console.log('GAMES', games);
      client.send(EColyseusMessages.SEND_GAMELIST, games); // TODO: one or both of the arrays in games could be empty. Check on FE
    });

    /**
     * GET_GAME
     */
    // TODO: implement in FE. Sending only currentTurn atm. We should have a registry in the FE
    this.onMessage(EColyseusMessages.GET_GAME, async (client: Client, data: {
      userId: string,
      gameId: string
    }): Promise<void> => {
      const game = await GameService.getGame(data.userId, data.gameId);
      client.send(EColyseusMessages.SEND_GAME, game);
    });

    /**
     * CLIENT_TURN_UPDATE
     */
    this.onMessage(EColyseusMessages.CLIENT_TURN_UPDATE, async (client: Client, message: ITurnMessage) => {
      console.log(`Turn sent by client ${(client as any).userId}`);

      if (message.gameOver) {
        await this.handleGameOver(message, client);
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
      message: string
    }): Promise<void> => {
      console.log(`Chat sent by client ${client.auth._id} in room ${this.roomId}`);
      const sanitizedMessage = recursiveSanitizeInput(message.message);

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
      const game = await LobbyService.handleNewGameRequest(message);
      if (!game) throw new CustomError(24);

      if (game.status === EGameStatus.SEARCHING) {
        client.send(EColyseusMessages.NEW_GAME_CREATED, game);
        return;
      }

      if (game.status === EGameStatus.PLAYING) {
        client.send(EColyseusMessages.NEW_GAME_STARTED, game);
        const opponentId = game.players[0].userId;
        const isOpponentOnline = this.clients.find(c => (c as any).userId === opponentId);
        const opponentIsFirstPlayer = game.activePlayer === game.players[0].userId;
        if (isOpponentOnline) {
          isOpponentOnline.send(EColyseusMessages.NEW_GAME_STARTED, game);
        } else if (opponentIsFirstPlayer) {
          LobbyService.offlineTurnNotification(opponentId);
        }
        return;
      }

      if (game.status === EGameStatus.CHALLENGE) {
        const challengedPlayer = game.players[1].userId;
        const isPlayerOnline = this.clients.find(c => (c as any).userId === challengedPlayer);
        if (isPlayerOnline) {
          isPlayerOnline.send(EColyseusMessages.CHALLENGE_RECEIVED, game);
        } else {
          LobbyService.offlineChallengeNotification(challengedPlayer, message.username);
        }
      }
    });

    /**
     * DELETE_GAME
     */
    this.onMessage(EColyseusMessages.DELETE_GAME_REQUEST, async (_client: Client, message: {
      gameId: string,
      userId: string
      challengerId?: string, // TODO: pass it here to simplify BE query
    }) => {
      GameService.deleteGame(message.userId, message.gameId); // fnf
      if (!message.challengerId) return;
      const isOnline = this.clients.find(c => (c as any).userId === message.challengerId);
      isOnline?.send(EColyseusMessages.CHALLENGE_REFUSED, message.gameId);
    });
  };

  onLeave(client: Client, _consented: boolean): void {
    console.log(`[Lobby ${this.roomId}] Client left: ${(client as any).userId}`);
    console.log(`[Lobby ${this.roomId}) Connected clients: ${this.clients}`);
  }

  onDispose(): void {
    console.log("[Lobby] Room disposed", this.roomId);
  }

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
  async handleGameOver(message: ITurnMessage, client: Client): Promise<void> {
    const gameOverUpdate = await LobbyService.handleGameOver(message);
    const { players, ...messageToSend } = gameOverUpdate;
    const opponent = players.find(p => p.userId !== (client as any).userId);
    const opponentOnline = this.clients.find(c => (c as any).userId === opponent?.userId);
    if (opponentOnline) opponentOnline.send(EColyseusMessages.GAME_OVER, messageToSend);
    client.send(EColyseusMessages.GAME_OVER, messageToSend);
  }

  async handleTurn(message: ITurnMessage): Promise<void> {
    const isOnline = this.clients.find(c => (c as any).userid === message.newActivePlayer);
    const turnUpdate = await LobbyService.handleTurn(message, !!isOnline);
    if (isOnline) isOnline.send(EColyseusMessages.SERVER_TURN_UPDATE, turnUpdate);
  }

  async handleUserDelete(data: {
    playersToNotify: {
      _id: ObjectId,
      email: string
    }[],
    deletedUserId: string;
  }): Promise<void> {
    if (!data.playersToNotify.length) return;

    const offlinePlayers: string[] = [];

    data.playersToNotify.forEach(p => {
      const isOnline = this.clients.find(c => (c as any).userId === p._id.toString());
      if (isOnline) { isOnline.send(EColyseusMessages.DELETED_GAME_UPDATE, data.deletedUserId); } else { offlinePlayers.push(p.email);} // TODO: a single message to the FE to delete all games. Should probably have a popup informing them
    });

    if (offlinePlayers.length) EmailService.sendGameDeletionEmail([...offlinePlayers]); // fnf
  }
}