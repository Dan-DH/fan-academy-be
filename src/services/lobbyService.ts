import { CustomError } from "../classes/customError";
import { EmailService } from "../emails/emailService";
import { EGameStatus, EGameModes } from "../enums/game.enums";
import IGame, { ITurnMessage, IPlayerData, IGameTurn } from "../interfaces/gameInterface";
import User from "../models/userModel";
import { updateUserStats } from "../utils/gameUtils";
import { DiscordNotificationService } from "./discordNotificationService";
import Game from "../models/gameModel";
import { IColyseusOnCreate } from "../interfaces/colyseusInterface";
import IUser from "../interfaces/userInterface";
import GameService from "./gameService";
import { Client, Room } from "@colyseus/core";
import { EColyseusMessages } from "../enums/colyseusMessage.enums";

export const LobbyService = {
  /**
   *
   * GAME OVER
   *
   */
  async handleGameOver(message: ITurnMessage) {
    const finishedAt = new Date();
    const { winner, winCondition } = message.gameOver!;

    // TODO: update turnHistory
    const updatedGame = await Game.findByIdAndUpdate(message._id, {
      currentTurn: message.currentTurn,
      turnNumber: message.turnNumber,
      activePlayer: message.newActivePlayer,
      gameOver: message.gameOver,
      status: EGameStatus.FINISHED,
      lastPlayedAt: finishedAt,
      finishedAt
    }, {
      new: true,
      runValidators: true
    });

    if (!updatedGame) throw new CustomError(24);

    // Retrieve user ids and publish the update to the users' game lists
    const userIds = updatedGame.players.map((player: IPlayerData) => player.userId);
    const userData = await User.find({ _id: { $in: userIds } }).lean(); // TODO: projection
    if (!userData) throw new CustomError(24);

    const userWon = updatedGame.players.find(player => player.userId === winner);
    const userLost = updatedGame.players.find(player => player.userId !== winner);
    if (!userWon || !userLost) throw new CustomError(24);

    const winnerData = userData.find(u => u._id.toString() === winner);
    const loserData = userData.find(u => u._id.toString() !== winner);
    if (!winnerData || !loserData) throw new CustomError(24);

    // Update users stats for ranked (standard games)
    if (updatedGame.gameMode === EGameModes.RANKED) await updateUserStats(userWon, userLost, winnerData, loserData, winCondition);

    const emails = [];
    if (winnerData.confirmedEmail && winnerData.preferences.emailNotifications) emails.push(winnerData.email);
    if (loserData.confirmedEmail && loserData.preferences.emailNotifications) emails.push(loserData.email);

    // Send gameover emails
    if (emails.length) {
      EmailService.sendGameOverEmail({
        winner: userWon,
        loser: userLost,
        emails
      }, winCondition); // fnf
    }

    if (userWon.username) DiscordNotificationService.sendGameFinished(userWon.username); // fnf
    if (userLost.username) DiscordNotificationService.sendGameFinished(userLost.username); // fnf

    // due to timeouts I need to send the message to both players // TODO: double check that timeouts go through here
    return {
      players: updatedGame.players, // TODO: remove from message
      gameId: message._id,
      previousTurn: message.currentTurn,
      userIds,
      turnNumber: message.turnNumber,
      lastPlayedAt: finishedAt,
      gameOver: message.gameOver
    };
  },

  /**
   *
   * TURN UPDATE
   *
   */
  async handleTurn(message: ITurnMessage, isOnline: boolean): Promise<IGameTurn> {
    const updatedGame = await Game.findByIdAndUpdate(message._id, {
      currentTurn: message.currentTurn,
      turnNumber: message.turnNumber,
      activePlayer: message.newActivePlayer,
      lastPlayedAt: message.lastPlayedAt
    }, {
      new: true,
      runValidators: true,
      projection: {
        currentTurn: 1,
        activePlayer: 1
      } // TODO: we only need this when sending a turn, right?
    });
    if (!updatedGame) throw new CustomError(24);

    // Send a notification if the new active player is offline, can receive emails and it has not already received a notification email since the last time they logged in
    const playerToNotify = await User.findById(updatedGame.activePlayer, {
      'preferences.emailNotifications': 1,
      username: 1,
      confirmedEmail: 1,
      turnEmailSent: 1,
      email: 1
    }).lean();
    if (!playerToNotify) throw new CustomError(40);

    const acceptsEmails = playerToNotify?.preferences.emailNotifications;

    if (!isOnline &&
      acceptsEmails &&
      playerToNotify.confirmedEmail &&
      !playerToNotify.turnEmailSent) {
      EmailService.sendTurnNotificationEmail(playerToNotify.email!, playerToNotify.username!); // TODO: fnf
      User.updateOne({ _id: playerToNotify._id }, { turnEmailSent: true }, { runValidators: true }); // TODO: fnf
    }

    DiscordNotificationService.sendYourTurn(playerToNotify.username); // TODO: fnf

    return updatedGame.currentTurn!;
  },

  /**
   * NEW GAME
   */
  async handleNewGameRequest(options: IColyseusOnCreate): Promise<IGame | null> {
    console.log('CREATING A NEW GAME');
    const { faction, username, portrait, gameMode, opponentId } = options;

    const gameLookingForPlayers = await GameService.matchmaking(options.userId, gameMode);
    let game: IGame | null = null;

    if (gameLookingForPlayers) {
      console.log('MATCHMAKING FOUND AN OPEN GAME');
      game = await GameService.addPlayerTwo(gameLookingForPlayers, options);
      if (!game) throw new CustomError(24);
      console.log('NEW GAME STARTED', game);
    } else {
      game = await GameService.createGame({
        userId: options.userId,
        username,
        portrait,
        faction,
        gameMode,
        opponentId
      });
      console.log('NEW GAME CREATED', game);
    }

    return game;
  },

  async handleChallengeAccepted(options: IColyseusOnCreate): Promise<IGame | null> {
    const game = await GameService.getFullGame(options.userId, options.gameId);
    if (!game) { throw new CustomError(24); };

    console.log('handleChallengeAccepted', game);

    const updatedGame = await GameService.addPlayerTwo(game, options);
    if (!updatedGame) { throw new CustomError(24); };

    return updatedGame;
  },

  informOpponentOfNewGameStarted(lobby: Room, game: IGame, client: Client): void {
    client.send(EColyseusMessages.NEW_GAME_STARTED, game);
    const opponentId = game.players[0].userId;
    const isOpponentOnline = lobby.clients.find(c => (c as any).userId === opponentId);
    const opponentIsFirstPlayer = game.activePlayer === game.players[0].userId;
    if (isOpponentOnline) {
      isOpponentOnline.send(EColyseusMessages.NEW_GAME_STARTED, game);
    } else if (opponentIsFirstPlayer) {
      LobbyService.offlineTurnNotification(opponentId);
    }
  },

  async offlineTurnNotification(userId: string): Promise<void> {
    const user: IUser | null = await User.findById(userId, {
      preferences: 1,
      confirmedEmail: 1,
      turnEmailSent: 1,
      email: 1,
      username: 1
    }).lean();
    if (!user) throw new CustomError(40);

    const acceptsEmails = user.preferences.emailNotifications;
    const confirmedEmail = user.confirmedEmail;
    const turnEmailSent = user.turnEmailSent;

    if (acceptsEmails && confirmedEmail && !turnEmailSent) EmailService.sendTurnNotificationEmail(user.email, user.username); // fnf
    DiscordNotificationService.sendYourTurn(user.username); // fnf
  },

  async offlineChallengeNotification(userId: string, challengerUsername: string): Promise<void> {
    const user = await User.findById(userId, {
      username: 1,
      email: 1,
      confirmedEmail: 1,
      'preferences.emailNotifications': 1
    }).lean();
    if (!user) throw new CustomError(40);

    if (user.confirmedEmail && user.preferences.emailNotifications) EmailService.sendChallengeNotificationEmail(user.email, user.username, challengerUsername); // fnf
    DiscordNotificationService.sendNewChallenge(user.username); // fnf
  }
};