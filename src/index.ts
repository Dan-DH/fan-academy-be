import { configDotenv } from "dotenv";

configDotenv({ path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env' });

import { Server } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import bodyParser from "body-parser";
import cors from "cors";
import express, { Express, Request, Response } from "express";
import "express-async-errors"; // Error MW patch
import http from 'http';
import passport from "passport";
import { GameRoom } from "./colyseus/gameRoom";
import { Lobby } from "./colyseus/lobby";
import gameRouter from './controllers/gameController';
import userRouter from './controllers/userController';
import { databaseConnection } from "./db";
import IUser from "./interfaces/userInterface";
import AppErrorHandler from "./middleware/errorHandler";
import { jwtStrategy, localStrategy } from "./middleware/passport";
import { sanitizeInput } from "./middleware/sanitizeInput";
import { ensureNotificationDefinitionsExist } from "./models/notificationModel";

const index = async () => {
  console.log('USING ENV:', process.env.NODE_ENV);
  const app: Express = express();
  const server = http.createServer(app);

  const colyseusServer = new Server({ transport: new WebSocketTransport() });
  colyseusServer.attach({
    transport: new WebSocketTransport({
      server,
      maxPayload: 1024 * 1024 * 1
    })
  });

  // Define lobby room for real time game updates
  colyseusServer.define('lobby', Lobby);

  // Define a room for the game
  colyseusServer.define('game_room', GameRoom).filterBy(['mongoId']).enableRealtimeListing();

  // Middleware
  app.use(express.json());
  app.use(sanitizeInput);
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(cors({
    origin: [process.env.LOCALHOST_BE!, process.env.LOCALHOST_FE!, process.env.FE_URL!],
    credentials: true
  }));

  await databaseConnection();

  // Ensure notification definitions exist before sending notifications
  await ensureNotificationDefinitionsExist();

  passport.use(localStrategy);
  passport.use(jwtStrategy);

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

  server.listen(process.env.PORT || '3003', () => {
    console.log(`[server]: Server is running`);
  });
};

index();
