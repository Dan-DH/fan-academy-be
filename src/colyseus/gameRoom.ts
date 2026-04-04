// import { JWT, JwtPayload } from "@colyseus/auth";
// import { AuthContext, Client, matchMaker, Room } from "@colyseus/core";
// import { CustomError } from "../classes/customError";
// import { EmailService } from "../emails/emailService";
// import { ITurnMessage } from "../interfaces/gameInterface";
// import { sanitizeInput } from "../middleware/sanitizeInput";
// import Game from "../models/gameModel";
// import User from '../models/userModel';
// import GameService from "../services/gameService";
// import { DiscordNotificationService } from "../services/discordNotificationService";
// import { handleGameOverUtil } from "../utils/gameUtils";
// import { IColyseusOnCreate } from "../interfaces/colyseusInterface";
// import IUser from "../interfaces/userInterface";

// export class GameRoom extends Room {
//   // connectedClients: Set<string> = new Set();

//   onInit(_options: any) { }

//   async onCreate(options: IColyseusOnCreate): Promise<void> {
//     console.log('ON CREATE ROOM - ID AND FACTION NAME', options.roomId, options.faction);

//     // CREATING A ROOM FOR A GAME ALREADY IN PLAY
//     if (options.roomId) await this.handleRoomForExistingGame(options);

//     // CREATING A ROOM FOR A NEW GAME
//     if (!options.roomId) await this.handleRoomForNewGame(options);

//     console.log("Game room created! ID -> ", this.roomId);

//     // MESSAGES // FIXME: check all messages
//     // I think I'm gonna need to route the game updates through the LobbyRoom to avoid sending the games to everyone with this.presence.publish
//   }

//   // Handle client joining
//   onJoin(client: Client, options: {
//     roomId: string,
//     userId: string,
//     token: string
//   }, _auth: any): void {
//     (client as any).userId = options.userId; // TypeScript workaround
//     this.connectedClients.add((client as any).userId);

//     console.log(`[Game] Client joined room: ${(client as any).userId} - ${this.roomId}`);
//     this.logConnectedClients();
//   }

//   async requestJoin(options: any, _client: Client): Promise<boolean> {
//     const { roomId, userId, token } = options;

//     if (!roomId || !userId || !token) {
//       console.warn("Missing parameter in join request.");
//       return false;
//     }

//     try {
//       // Verify the game exists and the user is a participant
//       const game = await GameService.getColyseusRoom(roomId, userId);

//       if (!game) {
//         console.warn(`No matching game found for roomId=${roomId} and userId=${userId}`);
//         return false;
//       }

//       const isPlayer = game.players.some(p => p.userData.toString() === userId);

//       if (!isPlayer) {
//         console.warn(`User ${userId} is not a player in game ${roomId}`);
//         return false;
//       }

//       // Optional: Reject if room is already full
//       if (this.clients.length >= this.maxClients) {
//         console.warn(`Room ${roomId} is full.`);
//         return false;
//       }

//       return true;
//     } catch (err) {
//       console.error("Error in requestJoin:", err);
//       return false;
//     }
//   }

//   // Handle client leaving
//   onLeave(client: Client, _consented: boolean): void {
//     this.connectedClients.delete((client as any).userId);
//     console.log(`[Game] Client left room: ${(client as any).userId}`);
//     this.logConnectedClients();
//   }

//   // Handle room disposal
//   onDispose(): void {
//     console.log("Room disposed", this.roomId);
//   }

//   logConnectedClients(): void {
//     console.log(`[Game] Connected clients: ${Array.from(this.connectedClients).join(", ")}`);
//   }

//   async handleRoomForExistingGame(options: IColyseusOnCreate): Promise<void> {
//     // get the game and check if the user is one of the players
//     const game = await GameService.getColyseusRoom(options.roomId!, options.userId);
//     if (!game) console.log('Player not found in players array');

//     console.log('CREATING A ROOM FOR A GAME ALREADY IN PLAY');

//     this.roomId = options.roomId!;
//   }

//   async handleRoomForNewGame(options: IColyseusOnCreate) {
//     const { faction, gameMode, opponentId } = options;

//     // Check for games already looking for players
//     const gameLookingForPlayers = await GameService.matchmaking(options.userId, gameMode);

//     console.log('CREATING A ROOM FOR A NEW GAME');

//     if (gameLookingForPlayers) {
//       console.log('Matchmaking found an open game');

//       const updatedGame = await GameService.addPlayerTwo(gameLookingForPlayers, faction, options.userId);
//       if (!updatedGame) throw new CustomError(24);

//       this.roomId = updatedGame._id.toString();

//       // Send a message to update the game list
//       const playerOneId = updatedGame.players[0].userId.toString();
//       this.presence.publish("newGamePresence", {
//         game: updatedGame, // TODO: probably don't need the whole game here
//         userIds: [options.userId, playerOneId]
//       });

//       // Send email to player 1 if they are the first player
//       if (updatedGame.activePlayer?.toString() === playerOneId) {
//         const isOnline = await matchMaker.presence.get(`user:${playerOneId}`);

//         const user: IUser | null = await User.findById(playerOneId, {
//           preferences: 1,
//           confirmedEmail: 1,
//           turnEmailSent: 1,
//           email: 1,
//           username: 1
//         }).lean();

//         if (!user) throw new CustomError(40);

//         const acceptsEmails = user.preferences.emailNotifications;
//         const confirmedEmail = user.confirmedEmail;
//         const turnEmailSent = user.turnEmailSent;

//         if (!isOnline && acceptsEmails && confirmedEmail && !turnEmailSent) {
//           await EmailService.sendTurnNotificationEmail(user.email, user.username);
//         }

//         try {
//           await DiscordNotificationService.sendYourTurn(user.username);
//         } catch (err) {
//           console.error('Failed to send Discord "your turn" notification:', err);
//         }
//       }
//     }

//     // If there are no games looking for players, create one
//     if (!gameLookingForPlayers) {
//       const newGame = await GameService.createGame({
//         userId: options.userId,
//         faction,
//         gameMode,
//         opponentId
//       });
//       console.log('NEWGAME', newGame);

//       if (!newGame) return undefined;

//       this.roomId = newGame._id.toString();

//       // Send a message to update the game list
//       this.presence.publish("newGamePresence", {
//         game: newGame,
//         userIds: [options.userId]
//       });
//     }
//   }
// }