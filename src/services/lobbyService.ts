import { CustomError } from "../classes/customError";
import { EmailService } from "../emails/emailService";
import { EGameStatus, EGameModes } from "../enums/game.enums";
import IGame, { ITurnMessage, IPlayerData, IGameTurn } from "../interfaces/gameInterface";
import User from "../models/userModel";
import { updateUserStats } from "../utils/gameUtils";
import { DiscordNotificationService } from "./discordNotificationService";
import Game from "../models/gameModel";
import { matchMaker } from "@colyseus/core";
import { IColyseusOnCreate } from "../interfaces/colyseusInterface";
import IUser from "../interfaces/userInterface";
import GameService from "./gameService";

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

    try {
      if (userWon.username) DiscordNotificationService.sendGameFinished(userWon.username); // fnf
      if (userLost.username) DiscordNotificationService.sendGameFinished(userLost.username); // fnf
    } catch (err) {
      console.error('Failed to send Discord game finished notification:', err);
    }

    // due to timeouts I need to send the message to both players // TODO: double check that timeouts go through here
    return {
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
  async handleTurn(message: ITurnMessage, isOnline: boolean): Promise<{ currentTurn: IGameTurn }> {
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

    try {
      DiscordNotificationService.sendYourTurn(playerToNotify.username); // TODO: fnf
    } catch (err) {
      console.error('Failed to send Discord your turn notification:', err);
    }

    return { currentTurn: updatedGame.currentTurn };
  },

  /**
   * NEW GAME
   */
  async handleNewGameRequest(options: IColyseusOnCreate) {
    const { faction, gameMode, opponentId } = options;
    console.log('CREATING A ROOM FOR A NEW GAME');

    // Check for games already looking for players
    const gameLookingForPlayers = await GameService.matchmaking(options.userId, gameMode);

    if (gameLookingForPlayers) {
      this.handleAddingPlayerTwo(gameLookingForPlayers, options);
    }
    // If there are no games looking for players, create one
    if (!gameLookingForPlayers) {
      const newGame = await GameService.createGame({
        userId: options.userId,
        faction,
        gameMode,
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
  },

  /**
   * ADD PLAYER TWO TO A NEW GAME
   */
  async handleAddingPlayerTwo(game: IGame, options: IColyseusOnCreate) {
    console.log('Matchmaking found an open game');

    const updatedGame = await GameService.addPlayerTwo(game, options);
    if (!updatedGame) throw new CustomError(24);

    this.roomId = updatedGame._id.toString();

    // Send a message to update the game list
    const playerOneId = updatedGame.players[0].userId.toString();
    this.presence.publish("newGamePresence", {
      game: updatedGame, // TODO: probably don't need the whole game here
      userIds: [options.userId, playerOneId]
    });

    // Send email to player 1 if they are the first player
    if (updatedGame.activePlayer?.toString() === playerOneId) {
      const isOnline = await matchMaker.presence.get(`user:${playerOneId}`);

      const user: IUser | null = await User.findById(playerOneId, {
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

      if (!isOnline && acceptsEmails && confirmedEmail && !turnEmailSent) {
        await EmailService.sendTurnNotificationEmail(user.email, user.username);
      }

      try {
        await DiscordNotificationService.sendYourTurn(user.username);
      } catch (err) {
        console.error('Failed to send Discord "your turn" notification:', err);
      }
    }
  }

};