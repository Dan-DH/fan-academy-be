import { Types } from "mongoose";
import { CustomError } from "../classes/customError";
import { EClass, EFaction, EGameModes, EGameStatus, EWinConditions } from "../enums/game.enums";
import IGame, { IPlayerData } from "../interfaces/gameInterface";
import Game from "../models/gameModel";
import { createFactionDeck, mapCrystalTypeToHealth, randomIntFromInterval, updateUserStats } from "../utils/gameUtils";
import { EmailService } from "../emails/emailService";
import User from "../models/userModel";
import { IColyseusOnCreate } from "../interfaces/colyseusInterface";
import { mapTemplates } from "../utils/mapTemplates";

const GameService = {
  // GET ACTIONS
  async getCurrentGamesForGameList(userId: string): Promise<IGame[] | null> {
    // Check for games where a player has not played for over a week and update them before returning the game list to the player
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const timedOutGames = await Game.find({
      'players.userId': userId,
      status: EGameStatus.PLAYING,
      lastPlayedAt: { $lt: oneWeekAgo }
    }, { players: 1 }).lean(); // TODO: project only needed fields

    if (timedOutGames) await this.handleTimedOutGames(timedOutGames);

    const gameList = await Game.aggregate([
      { $match: { 'players.userId': userId } },
      {
        $project: {
          players: 1,
          status: 1,
          lastPlayedAt: 1
        }
      },
      {
        $facet: {
          openGames: [
            { $match: { status: { $ne: EGameStatus.FINISHED } } },
            { $sort: { lastPlayedAt: 1 } }
          ],
          finishedGames: [
            { $match: { status: EGameStatus.FINISHED } },
            { $sort: { finishedAt: -1 } },
            { $limit: 10 }
          ]
        }
      }
    ]);

    console.log('getCurrentGamesForGameList', gameList);

    const { openGames, finishedGames } = gameList[0];

    return [...openGames, ...finishedGames];
  },

  async matchmaking(playerId: string, gameMode: EGameModes): Promise<IGame | null> {
    const result = await Game.findOne({
      players: { $elemMatch: { userData: { $ne: playerId } } },
      status: EGameStatus.SEARCHING,
      gameMode
    }).sort({ createdAt: 1 }).lean();

    return result;
  },

  async getGame(userId: string, gameId: string): Promise<IGame> {
    const game = await Game.findOne({
      _id: gameId,
      'players.userId': userId
    }, { currentTurn: 1 }).lean();
    if (!game) throw new CustomError(24);
    return game;
  },

  async getFullGame(userId: string, gameId: string): Promise<IGame> {
    const game = await Game.findOne({
      _id: gameId,
      'players.userId': userId
    }).lean();
    if (!game) throw new CustomError(24);
    return game;
  },

  // POST ACTIONS
  async createGame(params: {
    userId: string,
    username: string,
    portrait: string,
    faction: EFaction,
    gameMode: EGameModes,
    opponentUsername?: string,
    opponentPortrait?: string,
    opponentId?: string,
  }): Promise<IGame> {
    const { userId, username, portrait, faction, gameMode, opponentUsername, opponentPortrait, opponentId } = params;

    // Check if either player is above the max game limit
    const activeGamesLimit = 50;

    const [limits] = await Game.aggregate([
      {
        $match: {
          'players.userId': { $in: [userId, opponentId] },
          status: { $ne: EGameStatus.FINISHED }
        }
      },
      {
        $facet: {
          userCount: [
            { $match: { 'players.userId': userId } },
            { $count: "count" }
          ],
          opponentCount: [
            { $match: { 'players.userId': opponentId } },
            { $count: "count" }
          ]
        }
      }
    ]);

    const userActiveCount = limits.userCount[0]?.count || 0;
    const opponentActiveCount = limits.opponentCount[0]?.count || 0;

    if (userActiveCount >= activeGamesLimit || opponentActiveCount >= activeGamesLimit) {
      throw new CustomError(22);
    }

    // Create a new game
    const atDate = new Date();

    let result;
    try {
      result = await Game.create({
        players: [
          {
            userId,
            username,
            portrait,
            faction
          },
          ...opponentId ? [{
            userId: opponentId,
            username: opponentUsername,
            portrait: opponentPortrait
          }] : []
        ],
        gameMode,
        status: opponentId ? EGameStatus.CHALLENGE : EGameStatus.SEARCHING,
        turnNumber: 1,
        createdAt: atDate,
        lastPlayedAt: atDate
      });
    } catch (error) {
      console.log('[ERROR]', error);
      throw new CustomError(23);
    }

    return result;
  },

  async addPlayerTwo(game: IGame, options: IColyseusOnCreate): Promise<IGame | null> {
    try {
      const playerTwo = await User.findById(options.userId, {
        _id: 0,
        username: 1,
        portrait: 1
      }).lean();
      if (!playerTwo) throw new CustomError(40);

      const p1Deck = createFactionDeck(game.players[0].userId, game.players[0].faction!);
      const p2Deck = createFactionDeck(options.userId, options.faction);

      console.log('p1Deck', p1Deck);
      console.log('p2Deck', p2Deck);
      console.log('test', p1Deck[0]);

      // TODO: move this somewhere else
      const getActivePlayer = (p1: string, p2: string) => {
        return Math.random() < 0.5 ? p1 : p2;
      };
      const activePlayer = getActivePlayer(game.players[0].userId, options.userId);

      const map = randomIntFromInterval(0, 6);
      const boardState = mapTemplates[map].map(c => {
        return {
          unitId: `crystal_${c.boardPosition}}`,
          currentHealth: mapCrystalTypeToHealth(c.crystalType),
          boardPosition: c.boardPosition,
          class: EClass.CRYSTAL
        };
      });

      const pushStep = game.status === EGameStatus.SEARCHING ? {
        $push: {
          players: {
            userId: options.userId,
            username: playerTwo.username,
            portrait: playerTwo.portrait,
            faction: options.faction
          }
        }
      } : {};

      const updatedGame = await Game.findOneAndUpdate(
        {
          _id: game._id,
          status: { $in: [EGameStatus.SEARCHING, EGameStatus.CHALLENGE] }
        },
        {
          ...pushStep,
          $set: {
            status: EGameStatus.PLAYING,
            map,
            currentTurn: {
              turnStartSnapshot: {
                p1: { deck: p1Deck },
                p2: { deck: p2Deck },
                boardState
              }
            },
            lastPlayedAt: new Date(),
            activePlayer,
            ...game.status === EGameStatus.CHALLENGE ? { 'players.1.faction': options.faction } : {}
          }
        },
        {
          new: true,
          runValidators: true,
          projection: {
            currentTurn: 1,
            players: 1,
            lastPlayedAt: 1,
            status: 1,
            activePlayer: 1
          }
        }
      );

      console.log('it returns', updatedGame);

      return updatedGame;
    } catch (err) {
      console.error("Error adding a second player:", err);
      return null;
    }
  },

  async getColyseusRoom(roomId: string, userId: string): Promise<IGame | null> {
    console.log('getColyseusRoom gameId and userdata', roomId, userId);
    const gameId = new Types.ObjectId(roomId);
    const userData = new Types.ObjectId(userId);

    console.log('GAME ID and USER DATA', gameId, userData);
    const result = await Game.findOne({
      _id: gameId,
      'players.userData': userData
    }).populate('players.userData', 'email picture preferences');

    console.log('Result', result?._id);
    return result;
  },

  deleteGame(userId: string, gameId: string): void {
    try{
      Game.deleteOne({
        _id: gameId,
        'players.userId': userId,
        status: { $in: [EGameStatus.SEARCHING, EGameStatus.CHALLENGE] }
      }).exec();
    } catch (error) {
      throw new CustomError(24);
    }
  },

  async handleTimedOutGames(games: IGame[]): Promise<void> {
    const userInfoForEmails: {
      winner: IPlayerData,
      loser: IPlayerData,
      emails: string[]
    }[] = [];

    const gamesToUpdate = [];

    for (const game of games) {
      const winner = game.players.find(player => player.userId !== game.activePlayer?.toString());
      const loser = game.players.find(player => player.userId === game.activePlayer?.toString());
      if (!winner || !loser) throw new CustomError(24);
      const winnerData = await User.findById(winner.userId);
      const loserData = await User.findById(loser.userId);
      if (!winnerData || !loserData) throw new CustomError(24);

      if (game.gameMode === EGameModes.RANKED) await updateUserStats(winner, loser, winnerData, loserData, EWinConditions.TIMEOUT);

      const emails = [];
      if (winnerData?.preferences.emailNotifications && winnerData?.confirmedEmail) emails.push(winnerData.email!);
      if (loserData?.preferences.emailNotifications && loserData?.confirmedEmail) emails.push(loserData.email!);

      if (emails.length) {
        userInfoForEmails.push({
          winner: winner,
          loser: loser,
          emails
        });
      }

      gamesToUpdate.push({
        updateOne: {
          filter: { _id: game._id },
          update: {
            $set: {
              status: EGameStatus.FINISHED,
              gameOver: {
                winCondition: EWinConditions.TIMEOUT,
                winner: winner.userId
              },
              finishedAt: new Date()
            }
          }
        }
      });
    };

    if (gamesToUpdate.length > 0) await Game.bulkWrite(gamesToUpdate);

    for (let i = 0; i < userInfoForEmails.length; i++) {
      await EmailService.sendGameOverEmail(userInfoForEmails[i], EWinConditions.TIMEOUT);
    }
  }
};

export default GameService;
