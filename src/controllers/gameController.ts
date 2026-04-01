import { NextFunction, Request, Response, Router } from "express";
import { CustomError } from "../classes/customError";
import { EFaction, EGameModes } from "../enums/game.enums";
import GameService from "../services/gameService";
import { isAuthenticated } from "../middleware/jwt";

const router = Router();

// Get user's ongoing games
router.get('/playing', isAuthenticated, async (req: Request, res: Response, _next: NextFunction): Promise<Response> => {
  const userId = req.query.userId?.toString();

  const response = await GameService.getCurrentGames(userId!);

  return res.send(response);
});

// Get the oldest game looking for a player, if any
router.get('/matchmaking', isAuthenticated, async (req: Request, res: Response, _next: NextFunction): Promise<Response> => {
  const playerId = req.query.userId?.toString();
  const gameMode = req.query.gameMode?.toString() as EGameModes;

  if (!playerId) return res.sendStatus(400);

  const response = await GameService.matchmaking(playerId, gameMode);
  return res.send(response);
});

// Get a specific game
router.get('/get', isAuthenticated, async (req: Request, res: Response): Promise<Response> => {
  const userId = req.query.userId?.toString();
  const roomId = req.query.roomId?.toString();
  if (!userId || !roomId) throw new CustomError(23);
  const result = await  GameService.getGame(userId, roomId);
  return res.send(result);
});

/**
 *
 * POST
 *
 */
router.post('/newgame', isAuthenticated, async(req: Request, res: Response, _next: NextFunction): Promise<Response> => {
  const userId = req.query.userId?.toString();
  const faction = req.query.faction?.toString() as EFaction;
  const gameMode = req.query.gameMode?.toString() as EGameModes;
  const opponentId = req.query.opponentId?.toString();

  if (!userId || !faction || !opponentId) throw new CustomError(23);
  const response = await GameService.createGame({
    userId,
    faction,
    gameMode,
    opponentId
  });
  return res.send(response);
});

export default router;