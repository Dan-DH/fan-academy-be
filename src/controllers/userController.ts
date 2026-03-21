import { NextFunction, Request, Response, Router } from "express";
import passport from "passport";
import { CustomError } from "../classes/customError";
import IUser from "../interfaces/userInterface";
import { generateToken, isAuthenticated } from "../middleware/jwt";
import UserService from "../services/userService";
import { ELeaderboardEnum } from "../enums/leaderboard.enums";

const router = Router();

// GET USERS
router.get('/leaderboard', isAuthenticated, async (req: Request, res: Response) => {
  const boardType = req.query.type as ELeaderboardEnum;
  const rawPage = parseInt(req.query.page as string) || 1;
  const page = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;

  const result = await UserService.getLeaderboard(boardType, page);
  res.send(result);
});

router.get('/profile', isAuthenticated, async (req: Request, res: Response) => {
  return await UserService.getProfile(req, res);
});

// SIGN UP
router.post('/signup', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  await UserService.signup(req, res, next);
});

// LOGIN
router.post("/login", (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate("local", { session: false }, (err: any, user: Express.User | false, _info?: { message?: string }) => {
    if (err || !user) next(new CustomError(11));

    try {
      const typedUser = user as IUser;
      const token = generateToken({
        _id: typedUser._id.toString(),
        username: typedUser.username
      });

      res.send({
        token,
        userData: {
          userId: typedUser._id,
          preferences: typedUser.preferences
        }
      });
    } catch (err) {
      console.error("Token generation error:", err);
      return next(err);
    }
  })(req, res, next);
});

// PROFILE UPDATE
router.post('/update', isAuthenticated, async (req: Request, res: Response): Promise<Response> => {
  return await UserService.updateProfile(req, res);
});

// ACCOUNT DELETION
router.post('/delete', isAuthenticated, async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
  const user = req.user as IUser;
  if (!user) throw new CustomError(26);

  await UserService.deleteUser(user, next);

  return res.send({ success: true });
});

// EMAIL CONFIRMATION
router.get('/emailconfirm', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const token = req.query.token?.toString();
  if (!token) {
    // res.status(400).send('Missing token.');
    next('Invalid token. Please try again');
    return;
  }

  try {
    const emailConfirmed = await UserService.confirmEmail(token, next);
    if (emailConfirmed) res.redirect('https://fan-academy.onrender.com');
  } catch(err) {
    next(err);
  }
});

// PASSWORD RECOVERY
router.post('/password-recovery', async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  await UserService.passwordRecovery(req, next);
});

// PASSWORD RESET
router.post('/password-reset', async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  await UserService.passwordReset(req, next);
});

export default router;