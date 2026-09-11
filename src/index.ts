import './env.js';
import { defineRoom, defineServer } from "@colyseus/core";
import bodyParser from "body-parser";
import cors from "cors";
import express, { Request, Response } from "express";
import "express-async-errors"; // Error MW patch
import passport from "passport";
import { Lobby } from "./colyseus/lobby";
import gameRouter from './controllers/gameController';
import userRouter from './controllers/userController';
import { databaseConnection } from "./db";
import IUser from "./interfaces/userInterface";
import AppErrorHandler from "./middleware/errorHandler";
import { jwtStrategy, localStrategy } from "./middleware/passport";
import { sanitizeInput } from "./middleware/sanitizeInput";
import { ensureNotificationDefinitionsExist } from "./models/notificationModel";
import { WebSocketTransport } from "@colyseus/ws-transport";

const index = async () => {
  console.log('USING ENV:', process.env.NODE_ENV);

  const colyseusServer = defineServer({
    express(app) {
      app.use(express.json());
      app.use(sanitizeInput);
      app.use(bodyParser.urlencoded({ extended: true }));
      app.use(cors({
        origin: [process.env.LOCALHOST_BE!, process.env.LOCALHOST_FE!, process.env.FE_URL!],
        credentials: true
      }));

      app.get('/auth-check', passport.authenticate('jwt', { session: false }),
        (req: Request, res: Response) => {
          const user = req.user as IUser;

          res.send({
            userId: user._id,
            preferences: user.preferences
          });
        }
      );

      // Routes
      app.use('/users', userRouter);
      app.use('/games', gameRouter);
      app.get("/", (_req: Request, res: Response) => {
        res.send('Welcome to FA');
      });

      // Error handler
      app.use(AppErrorHandler);

      passport.use(localStrategy);
      passport.use(jwtStrategy);
    },
    rooms: { lobby: defineRoom(Lobby) },
    transport: new WebSocketTransport({ maxPayload: 1024 * 1024 * 1 })
  });

  await databaseConnection();

  // Ensure notification definitions exist before sending notifications
  await ensureNotificationDefinitionsExist();

  colyseusServer.listen(process.env.PORT || '3003').then(() => {
    console.log(`[server]: Server is running`);
  });
};

index();
