import { JWT } from "@colyseus/auth";
import { AuthContext, Client, Room } from "@colyseus/core";
import { JwtPayload } from "jsonwebtoken";
import { ObjectId } from "mongoose";
import { CustomError } from "../classes/customError";
import { EFaction } from "../enums/game.enums";
import IGame, { IGameState, IGameOver } from "../interfaces/gameInterface";
import { sanitize } from "../middleware/sanitizeInput";
import ChatLog from "../models/chatlogModel";
import GameService from "../services/gameService";
import User from "../models/userModel";

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
      console.log('MESSAGE', message);

      const clientsToExclude: Client[] = [];
      this.connectedClients.forEach(client => {
        if (!message.userIds.includes((client as any).userId)) clientsToExclude.push(client);
      });

      this.logConnectedClients();
      console.log('clientsTOExclude', clientsToExclude);
      this.broadcast('userDeletedUpdate', message, { except: clientsToExclude });
    });

    this.onMessage("chatMessageSent", async (client: Client, message: {
      gameRoomId: string,
      userIds: string[],
      message: string,
      token: string
    }) => {
      console.log(`Chat sent by client ${client.auth._id} in room ${message.gameRoomId }`);

      const sanitizedMessage = sanitize(message.message);

      // Update the chat log on the db, or create one if none exists
      const messageToPush = {
        username: client.auth.username,
        message: sanitizedMessage,
        createdAt: new Date()
      };

      const updatedChatlog = await ChatLog.findByIdAndUpdate(message.gameRoomId, { $push: { messages: messageToPush } });

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
        roomId: message.gameRoomId,
        message: messageToPush
      }, { except: clientsToExclude });
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
}