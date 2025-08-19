import { JWT, JwtPayload } from "@colyseus/auth";
import { AuthContext, Client, matchMaker, Room } from "@colyseus/core";
import { CustomError } from "../classes/customError";
import { EmailService } from "../emails/emailService";
import { EFaction, EGameStatus } from "../enums/game.enums";
import { IPlayerData, IPopulatedPlayerData, IPopulatedUserData, ITurnMessage } from "../interfaces/gameInterface";
import { sanitize } from "../middleware/sanitizeInput";
import ChatLog from "../models/chatlogModel";
import Game from "../models/gameModel";
import User from '../models/userModel';
import GameService from "../services/gameService";
import { DiscordNotificationService } from "../services/discordNotificationService";

export class GameRoom extends Room {
  connectedClients: Set<string> = new Set();

  onInit(_options: any) { }

  async onCreate(options: {
    userId: string,
    faction: EFaction,
    token: string,
    roomId?: string,
    opponentId?: string
  }): Promise<void> {
    /**
     * onCreate can be called when:
     * -looking for a game.
     *    -checks for already opened rooms
     *      -if no room is found:
     *        -creates the room for the first time (no second player, room is disposed of immediatly), also no roomId (uuid) provided by the FE
     *        -creates the room, adds player1 data, sets the room status to 'searching'
     *
     *      -if a room is found, adds player2 data, sets room status to 'playing'
     *
     *      -update the game list
     *
     * -re-creating a room: the options parameter provides the roomId
     *    -checks if the user is one of the two players, then grants access and sends the state
     */
    const { faction, roomId, opponentId } = options;

    console.log('ON CREATE ROOM - ID AND FACTION NAME', roomId, faction);
    /**
     *
     * CREATING A ROOM FOR A GAME ALREADY IN PLAY
     *
     */
    if (roomId) {
      // get the game and check if the user is one of the players
      const game = await GameService.getColyseusRoom(roomId, options.userId);
      if (!game) console.log('Player not found in players array');

      console.log('CREATING A ROOM FOR A GAME ALREADY IN PLAY');

      this.roomId = roomId;
    }

    /**
     *
     * CREATING A ROOM FOR A NEW GAME
     *
     */
    if (!roomId) {
      // Check for games already looking for players
      const gameLookingForPlayers = await GameService.matchmaking(options.userId);

      console.log('CREATING A ROOM FOR A NEW GAME');

      if (gameLookingForPlayers) {
        console.log('Matchmaking found an open game');

        const updatedGame = await GameService.addPlayerTwo(gameLookingForPlayers, faction, options.userId);
        if (!updatedGame) throw new CustomError(24);

        this.roomId = updatedGame._id.toString();

        // Send a message to update the game list
        const playerOneId = updatedGame.players[0].userData._id.toString();
        this.presence.publish("newGamePresence", {
          game: updatedGame,
          userIds: [options.userId, playerOneId]
        });

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

      // If there are no games looking for players, create one
      if (!gameLookingForPlayers) {
        const newGame = await GameService.createGame({
          userId: options.userId,
          faction,
          opponentId
        });
        console.log('NEWGAME', newGame);

        if (!newGame) return undefined;

        this.roomId = newGame._id.toString();

        // Send a message to update the game list
        this.presence.publish("newGamePresence", {
          game: newGame,
          userIds: [options.userId]
        });
      }
    }

    console.log("Game room created! ID -> ", this.roomId);

    this.onMessage("turnSent", async (client: Client, message: ITurnMessage) => {
      console.log(`Turn sent by client ${(client as any).userId}`);

      if (message.gameOver) {
        console.log('Game over!');
        await this.handleGameOver(message);
      } else {
        await this.handleTurn(message);
      }
    });

    this.onMessage("ping", (client: Client) => {
      console.log(`Received game ping from user ${(client as any).userId}`);
      this.broadcast('pong');
    });

    this.onMessage("chatMessage", async (client: Client, message: {
      _id: string,
      message: string,
      token: string
    }) => {
      console.log(`Chat sent by client ${client.auth._id} in room ${this.roomId}`);
      const sanitizedMessage = sanitize(message.message);

      // Update the chat log on the db, or create one if none exists
      const messageToPush = {
        username: client.auth.username,
        message: sanitizedMessage,
        createdAt: new Date()
      };

      const updatedChatlog = await ChatLog.findByIdAndUpdate(this.roomId, { $push: { messages: messageToPush } });

      // Safeguard in case a chatlog wasn't created alongside the game
      if (!updatedChatlog) {
        const chatLog = new ChatLog({
          _id: this.roomId,
          messages: [messageToPush]
        });
        await chatLog.save();
      }

      this.broadcast('chatMessageReceived', {
        username: client.auth.username,
        message: sanitizedMessage
      });
    });
  }

  async handleGameOver(message: ITurnMessage): Promise<void> {
    const finishedAt = new Date();
    const { winner, winCondition } = message.gameOver!;

    const updatedGame = await Game.findByIdAndUpdate(message._id, {
      previousTurn: message.currentTurn,
      turnNumber: message.turnNumber,
      activePlayer: message.newActivePlayer,
      gameOver: message.gameOver,
      status: EGameStatus.FINISHED,
      lastPlayedAt: finishedAt,
      finishedAt
    }, { new: true }).populate('players.userData', "username picture email confirmedEmail");

    if (!updatedGame) throw new CustomError(24);

    // Retrieve user ids and publish update the users' game lists
    const userIds = updatedGame.players.map((player: IPlayerData) => player.userData._id.toString());
    this.presence.publish("gameOverPresence", {
      gameId: message._id,
      previousTurn: message.currentTurn,
      userIds,
      turnNumber: message.turnNumber,
      lastPlayedAt: finishedAt,
      gameOver: message.gameOver
    });

    // Update users stats
    const userWon = updatedGame.players.find(player => player.userData._id.toString() === winner) as unknown as IPopulatedPlayerData;
    const userLost = updatedGame.players.find(player => player.userData._id.toString() !== winner) as unknown as IPopulatedPlayerData;

    if (!userWon || !userLost) throw new CustomError(24);

    const updateWinner = await User.findByIdAndUpdate(
      userWon.userData._id,
      {
        $inc: {
          'stats.totalGames': 1,
          'stats.totalWins': 1,
          ...userWon.faction === EFaction.COUNCIL ? { 'stats.councilWins': 1 } : { 'stats.elvesWins': 1 }
        }
      }
    );

    const updateLoser = await User.findByIdAndUpdate(userLost.userData._id, { $inc: { 'stats.totalGames': 1 } });

    if (!updateWinner || !updateLoser) throw new CustomError(24);

    const emails = [];
    if (updateWinner?.preferences.emailNotifications) emails.push(updateWinner.email);
    if (updateLoser?.preferences.emailNotifications) emails.push(updateLoser.email);

    // Send gameover emails
    if (emails.length) {
      await EmailService.sendGameOverEmail({
        winner: userWon,
        loser: userLost,
        emails
      }, winCondition);
    }

    try {
      if (userWon?.userData?.username) await DiscordNotificationService.sendGameFinished(userWon.userData.username);
      if (userLost?.userData?.username) await DiscordNotificationService.sendGameFinished(userLost.userData.username);
    } catch (err) {
      console.error('Failed to send Discord game finished notification:', err);
    }
  }

  async handleTurn(message: ITurnMessage): Promise<void> {
    const lastPlayedAt = new Date();
    const updatedGame = await Game.findByIdAndUpdate(message._id, {
      previousTurn: message.currentTurn,
      turnNumber: message.turnNumber,
      activePlayer: message.newActivePlayer,
      lastPlayedAt
    }, { new: true }).populate('players.userData', "username picture preferences email confirmedEmail turnEmailSent");

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
        await User.findByIdAndUpdate(userData._id, { turnEmailSent: true });
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

  // Handle client joining
  onJoin(client: Client, options: {
    roomId: string,
    userId: string,
    token: string
  }, _auth: any): void {
    (client as any).userId = options.userId; // TypeScript workaround
    this.connectedClients.add((client as any).userId);

    console.log(`[Game] Client joined room: ${(client as any).userId} - ${this.roomId}`);
    this.logConnectedClients();
  }

  async requestJoin(options: any, _client: Client): Promise<boolean> {
    const { roomId, userId, token } = options;

    if (!roomId || !userId || !token) {
      console.warn("Missing parameter in join request.");
      return false;
    }

    try {
      // Verify the game exists and the user is a participant
      const game = await GameService.getColyseusRoom(roomId, userId);

      if (!game) {
        console.warn(`No matching game found for roomId=${roomId} and userId=${userId}`);
        return false;
      }

      const isPlayer = game.players.some(p => p.userData.toString() === userId);

      if (!isPlayer) {
        console.warn(`User ${userId} is not a player in game ${roomId}`);
        return false;
      }

      // Optional: Reject if room is already full
      if (this.clients.length >= this.maxClients) {
        console.warn(`Room ${roomId} is full.`);
        return false;
      }

      return true;
    } catch (err) {
      console.error("Error in requestJoin:", err);
      return false;
    }
  }

  // Handle client leaving
  onLeave(client: Client, _consented: boolean): void {
    this.connectedClients.delete((client as any).userId);
    console.log(`[Game] Client left room: ${(client as any).userId}`);
    this.logConnectedClients();
  }

  // Handle room disposal
  onDispose(): void {
    console.log("Room disposed", this.roomId);
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

  logConnectedClients(): void {
    console.log(`[Game] Connected clients: ${Array.from(this.connectedClients).join(", ")}`);
  }
}
