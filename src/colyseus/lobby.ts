import { JWT } from "@colyseus/auth";
import { AuthContext, Client, matchMaker, Room } from "@colyseus/core";
import { JwtPayload } from "jsonwebtoken";
import { HydratedDocument, ObjectId } from "mongoose";
import { CustomError } from "../classes/customError";
import { EFaction, EGameModes } from "../enums/game.enums";
import IGame, { IGameState, IGameOver, IPlayerData, IPopulatedUserData, ITurnMessage } from "../interfaces/gameInterface";
import { sanitize } from "../middleware/sanitizeInput";
import ChatLog from "../models/chatlogModel";
import GameService from "../services/gameService";
import User from "../models/userModel";
import { EmailService } from "../emails/emailService";
import { DiscordNotificationService } from "../services/discordNotificationService";
import { handleGameOverUtil } from "../utils/gameUtils";
import Game from "../models/gameModel";

export class Lobby extends Room {
  connectedClients: Set<Client> = new Set();

  async onJoin(client: Client, options: { userId: string }) {
    (client as any).userId = options.userId; // TypeScript workaround
    this.presence.set(`user:${options.userId}`, 'online');
    this.connectedClients.add(client);
    console.log(`[Lobby ${this.roomId}] Client joined: ${(client as any).userId}`);
    this.logConnectedClients();
    await User.findByIdAndUpdate(options.userId, { turnEmailSent: false }, { runValidators: true });
  }

  onCreate(_options: {
    userId: string,
    token: string
  }): void {
    // Updating an existing game
    this.presence.subscribe('gameUpdatedPresence', (message: {
      gameId: ObjectId
      previousTurn: IGameState[],
      newActivePlayer: string,
      userIds: string[],
      turnNumber: number,
      lastPlayedAt: Date
    }) => {
      console.log(`[Lobby ${this.roomId}] Received subscribed gameUpdatedPresence message`);
      this.logConnectedClients();

      const clientsToExclude: Client[] = [];
      this.connectedClients.forEach(client => {
        if (!message.userIds.includes((client as any).userId)) clientsToExclude.push(client);
      });

      this.broadcast('gameListUpdate', message, { except: clientsToExclude });
    });

    // Updating with a new game (2 players)
    this.presence.subscribe('newGamePresence', (message: {
      game: IGame,
      userIds: string[]
    }) => {
      console.log(`[Lobby ${this.roomId}] Received subscribed newGamePresence message`);
      this.logConnectedClients();

      const clientsToExclude: Client[] = [];
      this.connectedClients.forEach(client => {
        if (!message.userIds.includes((client as any).userId)) clientsToExclude.push(client);
      });

      this.broadcast('newGameListUpdate', message, { except: clientsToExclude });
    });

    // Updating on a game ending
    this.presence.subscribe('gameOverPresence', (message: {
      gameId: ObjectId
      previousTurn: IGameState[],
      userIds: string[],
      turnNumber: number,
      lastPlayedAt: Date,
      gameOver: IGameOver
    }) => {
      console.log(`[Lobby ${this.roomId}] Received subscribed gameOverPresence message`);

      const clientsToExclude: Client[] = [];
      this.connectedClients.forEach(client => {
        if (!message.userIds.includes((client as any).userId)) clientsToExclude.push(client);
      });

      this.broadcast('gameOverUpdate', message, { except: clientsToExclude });
    });

    // Deleting a challenge
    this.presence.subscribe('gameDeletedPresence', (message: {
      gameId: ObjectId,
      userIds: string[]
    }) => {
      console.log(`[Lobby ${this.roomId}] Received subscribed gameDeletedPresence message`);

      const clientsToExclude: Client[] = [];
      this.connectedClients.forEach(client => {
        if (!message.userIds.includes((client as any).userId)) clientsToExclude.push(client);
      });

      this.broadcast('gameDeletedUpdate', message, { except: clientsToExclude });
    });

    this.onMessage("gameDeletedMessage", async (client: Client, message: {
      userId: string,
      gameId: string
    }) => {
      const result = await GameService.deleteGame(message.userId, message.gameId);

      this.presence.publish('gameDeletedPresence', {
        gameId: message.gameId,
        userIds: result
      });
    });

    this.onMessage("challengeAcceptedMessage", async (client: Client, message: {
      userId: string,
      gameId: string,
      faction: EFaction
    }) => {
      const userId = message.userId ;
      const gameId = message.gameId;
      const faction = message.faction as EFaction;

      if (!userId || !gameId || !faction) throw new CustomError(23);

      const game = await GameService.getGame(userId, gameId);
      if (!game) throw new CustomError(24);

      const result = await GameService.addPlayerTwo(game, faction as EFaction, userId);

      const userIds = result?.players.map(player => { return player.userData._id.toString();});
      this.presence.publish('newGamePresence', {
        game: result,
        userIds
      });
    });

    // Deleting a user
    this.presence.subscribe('userDeletedPresence', (message: {
      userIds: string[],
      gameIds: string[]
    }) => {
      console.log(`[Lobby ${this.roomId}] Received subscribed userDeletedPresence message`);

      const clientsToExclude: Client[] = [];
      this.connectedClients.forEach(client => {
        if (!message.userIds.includes((client as any).userId)) clientsToExclude.push(client);
      });

      this.logConnectedClients();
      this.broadcast('userDeletedUpdate', message, { except: clientsToExclude });
    });

    this.onMessage("chatMessageSent", async (client: Client, message: {
      gameId: string,
      userIds: string[],
      message: string,
    }) => {
      console.log(`Chat sent by client ${client.auth._id} in room ${message.gameId }`);

      const sanitizedMessage = sanitize(message.message);

      // Update the chat log on the db, or create one if none exists
      const messageToPush = {
        username: client.auth.username,
        message: sanitizedMessage,
        createdAt: new Date()
      };

      const updatedChatlog = await ChatLog.findByIdAndUpdate(message.gameId, { $push: { messages: messageToPush } });

      // Safeguard in case a chatlog wasn't created alongside the game
      if (!updatedChatlog) {
        const chatLog = new ChatLog({
          _id: this.roomId,
          messages: [messageToPush]
        });
        await chatLog.save();
      }

      const clientsToExclude: Client[] = [];
      this.connectedClients.forEach(client => {
        if (!message.userIds.includes((client as any).userId)) clientsToExclude.push(client);
      });

      this.broadcast('chatMessageReceived', {
        roomId: message.gameId,
        message: messageToPush
      }, { except: clientsToExclude });
    });

    this.onMessage("turnSent", async (client: Client, message: ITurnMessage) => {
      console.log(`Turn sent by client ${(client as any).userId}`);

      if (message.gameOver) {
        await this.handleGameOver(message);
      } else {
        await this.handleTurn(message);
      }
    });

    this.onMessage("createGame", async (client: Client, message: {
      userId: string,
      faction: EFaction,
      gameMode: EGameModes
    }) => {
      const { userId, faction, gameMode  } = message;

      const gameLookingForPlayers = await GameService.matchmaking(userId, gameMode); // TODO: improve matchmaking

      if (gameLookingForPlayers) {
        this.handleGameMatch(gameLookingForPlayers, faction, userId);
      } else {
        this.handleNoGameMatch(message);
      }
    });
  };

  // Handle client leaving
  onLeave(client: Client): void {
    console.log(`[Lobby ${this.roomId}] Client left: ${(client as any).userId}`);
    this.presence.del(`user:${(client as any).userId}`);
    this.connectedClients.delete(client);
    this.logConnectedClients();
  }

  // Handle lobby disposal
  onDispose(): void {
    console.log("[Lobby] Room disposed", this.roomId);
  }

  async onAuth(client: Client, options: any, _context: AuthContext): Promise<JwtPayload | boolean> {
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

  logConnectedClients() {
    const clients = Array.from(this.connectedClients).map(client => { return (client as any).userId; });

    console.log(`[Lobby ${this.roomId}] Connected clients: ${clients}`);
  }

  onUncaughtException (err: Error, methodName: string) {
    console.error("An error occurred in", methodName, ":", err);
    err.cause; // original unhandled error
    err.message; // original error message
  }

  async handleGameOver(message: ITurnMessage): Promise<void> {
    const result = await handleGameOverUtil(message);
    this.presence.publish("gameOverPresence", result);
  }

  async handleTurn(message: ITurnMessage): Promise<void> {
    const lastPlayedAt = new Date();
    const updatedGame = await Game.findByIdAndUpdate(message._id, {
      previousTurn: message.currentTurn,
      turnNumber: message.turnNumber,
      activePlayer: message.newActivePlayer,
      lastPlayedAt
    }, {
      new: true,
      runValidators: true
    }).populate('players.userData', "username picture preferences email confirmedEmail turnEmailSent");

    if (!updatedGame) throw new CustomError(24);

    // Send a notification if the new active player is offline, can receive emails and it has not already received a notification email since the last time they logged in
    const playerToNotify = updatedGame.players.find((player) =>
      player.userData._id.toString() === updatedGame.activePlayer?.toString());

    if (playerToNotify) {
      const userData = playerToNotify.userData as unknown as IPopulatedUserData;

      const isOnline = await matchMaker.presence.get(`user:${updatedGame.activePlayer}`);

      const acceptsEmails = userData.preferences?.emailNotifications;
      const confirmedEmail = userData?.confirmedEmail;
      const turnEmailSent = userData?.turnEmailSent;

      if (!isOnline && acceptsEmails && confirmedEmail! && !turnEmailSent) {
        await EmailService.sendTurnNotificationEmail(userData.email!, userData.username!);
        await User.findByIdAndUpdate(userData._id, { turnEmailSent: true }, { runValidators: true });
      }

      try {
        if (typeof userData.username === 'string') {
          await DiscordNotificationService.sendYourTurn(userData.username);
        }
      } catch (err) {
        console.error('Failed to send Discord your turn notification:', err);
      }
    }

    // Retrieve user ids and publish update the users' game lists
    const userIds = updatedGame.players.map((player: IPlayerData) => player.userData._id.toString());
    this.presence.publish("gameUpdatedPresence", {
      gameId: message._id,
      previousTurn: message.currentTurn,
      turnNumber: message.turnNumber,
      newActivePlayer: message.newActivePlayer.toString(),
      lastPlayedAt,
      userIds
    });
  }

  async handleGameMatch(gameMatch: HydratedDocument<IGame>, faction: EFaction, userId: string): Promise<void> {
    console.log('Matchmaking found an open game');

    const updatedGame = await GameService.addPlayerTwo(gameMatch, faction, userId);
    if (!updatedGame) throw new CustomError(24);

    // Send a message to update the game list
    const playerOneId = updatedGame.players[0].userData._id.toString();
    this.presence.publish("newGamePresence", {
      game: updatedGame,
      userIds: [userId, playerOneId]
    }); // TODO: change this to a normal message

    // Send email to player 1 if they are the first player
    if (updatedGame.activePlayer?.toString() === playerOneId) {
      const userData = updatedGame.players[0].userData as unknown as IPopulatedUserData;

      const isOnline = await matchMaker.presence.get(`user:${playerOneId}`);

      const acceptsEmails = userData.preferences?.emailNotifications;

      const confirmedEmail = userData?.confirmedEmail;

      if (!isOnline && acceptsEmails && confirmedEmail!) {
        await EmailService.sendTurnNotificationEmail(userData.email!, userData.username!);
      }

      try {
        if (typeof userData.username === 'string') await DiscordNotificationService.sendYourTurn(userData.username);
      } catch (err) {
        console.error('Failed to send Discord your turn notification:', err);
      }
    }
  }

  async handleNoGameMatch(message: {
    userId: string,
    faction: EFaction,
    gameMode: EGameModes
  }): Promise<void> {
    const { userId, faction, gameMode } = message;
    const newGame = await GameService.createGame({
      userId,
      faction,
      gameMode
    });
    if (!newGame) return undefined;

    // Send a message to update the game list
    this.presence.publish("newGamePresence", {
      game: newGame,
      userIds: [userId] // FIXME: change to normal message
    });
  }
}