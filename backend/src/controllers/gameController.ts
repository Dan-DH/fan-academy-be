import { NextFunction, Request, Response, Router } from "express";
import { isAuthenticated } from "../middleware/isAuthenticated";
import GameService from "../services/gameService";
import { EGameTermination } from "../enums/game.enums";
// import passport from "passport";
// import UserService from "../services/userService";

const router = Router();

// Get user's ongoing games
router.get('/playing', isAuthenticated, async (req: Request, res: Response, _next: NextFunction) => {
  return GameService.getActiveGames(req, res);
});

// Get games looking for players
router.get('/open', isAuthenticated, async (req: Request, res: Response, _next: NextFunction) => {
  return GameService.getOpenGames(res);
});

// Get a specific game
router.get('/:id', isAuthenticated, async (req: Request, res: Response, next: NextFunction)=> {
  return GameService.getGame(req, res, next);
});

// Send turn for a game
router.post('/:id/new-turn', isAuthenticated, async (req: Request, res: Response, next: NextFunction)=> {
  // TODO: create a isAuthorized MW to check if a user can send moves / concede / cancel games
  return GameService.sendTurn(req, res, next);
});

// Terminate a game - used for both conceding a game or cancelling a game searching for players
router.post('/:id/terminate', isAuthenticated, async (req: Request, res: Response, next: NextFunction)=> {
  // TODO: create a isAuthorized MW to check if a user can send moves / concede / cancel games
  const { reason } = req.body;
  if (reason == EGameTermination.CANCELED) {
    await GameService.deleteGame(req.params.id, next);
    res.sendStatus(201);
  };
  if (reason == EGameTermination.CONCEDED) {
    await GameService.endGame(req, res, next);
    res.sendStatus(201);
  }
});