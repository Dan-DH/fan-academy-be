import { matchMaker } from '@colyseus/core';
import { hash } from 'bcrypt';
import { Request, Response } from "express";
import { NextFunction } from 'express-serve-static-core';
import { CustomError } from '../classes/customError';
import { EGameStatus } from '../enums/game.enums';
import { IPopulatedUserData } from '../interfaces/gameInterface';
import IUser from "../interfaces/userInterface";
import Game from "../models/gameModel";
import User from "../models/userModel";
import { generateToken } from '../middleware/jwt';
import { getConfirmationLink } from '../utils/tokenGeneration';
import { EmailService } from '../emails/emailService';
import { DiscordNotificationService } from './discordNotificationService';

const UserService = {
  async signup(req: Request, res: Response, next: NextFunction): Promise<void> {
    const username = req.body.username.trim();
    const email = req.body.email.trim();
    const password = req.body.password.trim();

    if (!username || !email || !password) throw new CustomError(31);

    // Check if the username or email are already in use
    const userAlreadyExists: IUser[] = await User.find({ $or: [{ username }, { email }] });
    if (userAlreadyExists.length) throw new CustomError(12);

    // If the user doesn't exist, create a new user with an encrypted password
    const emailConfirmationLink = getConfirmationLink();
    try {
      const hashedPassword = await hash(password, 10);
      const newUser = new User({
        username,
        email,
        password: hashedPassword,
        picture: 'crystalIcon',
        currentGames: [],
        gameHistory: [],
        preferences: {},
        stats: {},
        emailConfirmationLink
      });
      const user = await newUser.save();
      if (!user) throw new CustomError(30);

      // Send email confirmation email

      await EmailService.sendAccountConfirmationEmail({
        username,
        email,
        emailConfirmationLink
      });

      // Generate JSON token afterthe user is successfully saved to the db
      const token = generateToken({
        _id: user._id.toString(),
        username: user.username
      });

      res.status(201).json({
        message: "User created successfully",
        token,
        userData: {
          userId: user._id,
          preferences: user.preferences
        }
      });
    } catch (err: any) {
      console.log('Error', err);
      next(err.message);
    }
  },

  async confirmEmail(token: string, next: NextFunction): Promise<boolean> {
    try {
      const userMatch = await User.findOneAndUpdate({ emailConfirmationLink: token }, {
        emailConfirmationLink: null,
        confirmedEmail: true
      });
      if (userMatch) return true;
    } catch (err) {
      next(err);
    }
    return false;
  },

  async updateProfile(req: Request, res: Response): Promise<Response> {
    const user = req.user as IUser; // User data is populated by Passport
    const { email, password, picture, emailNotifications, chat, sound } = req.body;

    const updateFields: any = {};

    // Top-level fields
    if (email) {
      updateFields.email = email;
      // Check if the email is already in use
      const emailAlreadyExists: IUser | null = await User.findOne({ email });
      if (emailAlreadyExists) throw new CustomError(12);
    }

    if (password) {
      const hashedPassword = await hash(password, 10);
      updateFields.password = hashedPassword;
    }

    if (picture) updateFields.picture = picture;

    // Nested preferences
    if (emailNotifications !== undefined) updateFields['preferences.emailNotifications'] = emailNotifications;
    if (chat !== undefined) updateFields['preferences.chat'] = chat;
    if (sound !== undefined) updateFields['preferences.sound'] = sound;

    const result = await User.findByIdAndUpdate(user._id, updateFields, { new: true });

    if (!result) throw new CustomError(41);

    return res.send(result);
  },

  async deleteUser(user: IUser, next: NextFunction): Promise<void> {
    try {
      // Find and remove open games / and challenges, and inform the other players
      const userIdsToUpdate = new Set<string>();
      const userEmailsToUpdate = new Set<string>();
      const opponentUsernamesToUpdate = new Set<string>();
      const gamesToDelete = new Set<string>();
      const affectedGames = await Game.find({ 'players.userData': user._id }).populate('players.userData', 'email confirmedEmail username');

      if (affectedGames.length) {
        affectedGames.forEach(game => {
          if (game.status === EGameStatus.SEARCHING || game.status === EGameStatus.FINISHED) return;

          gamesToDelete.add(game._id.toString());

          const opponent = game.players.find(player => player.userData._id.toString() !== user._id.toString());
          const opponentUserData = opponent?.userData as unknown as IPopulatedUserData;

          if (opponentUserData?.email && opponentUserData.confirmedEmail) userEmailsToUpdate.add(opponentUserData.email);
          if (opponentUserData?._id) userIdsToUpdate.add(opponentUserData._id.toString());
          if (opponentUserData?.username) opponentUsernamesToUpdate.add(opponentUserData.username);
        });

        await Game.deleteMany({ 'players.userData': user._id });
      }

      const deletedUser: IUser | undefined | null = await User.findOneAndDelete({ _id: user._id });
      if (!deletedUser) throw new CustomError(40);
      // Send email to user
      await EmailService.sendAccountDeletionEmail(deletedUser.email);

      if (userIdsToUpdate.size > 0) {
        await EmailService.sendGameDeletionEmail([...userEmailsToUpdate]);

        try {
          for (const username of opponentUsernamesToUpdate) {
            await DiscordNotificationService.sendGameDeleted(username);
          }
        } catch (err) {
          console.error('Failed to send Discord account deletion notification:', err);
        }

        // Send a message to update the game list of the affected players
        matchMaker.presence.publish('userDeletedPresence', {
          userIds: [...userIdsToUpdate],
          gameIds: [...gamesToDelete]
        });
      }
    } catch (err) {
      console.log(err);
      next(err);
    }
  },

  async getLeaderboard(page: number): Promise<{
    players: IUser[],
    totalPages: number,
    currentPage: number
  }> {
    const limit = 12;
    const skip = (page - 1) * limit;

    const players = await User.find({}, {
      username: 1,
      picture: 1,
      stats: 1
    }).sort({
      'stats.totalWins': -1,
      'stats.totalGames': 1,
      _id: 1
    }).skip(skip).limit(limit);

    const totalPlayers = await User.countDocuments();

    return {
      players,
      totalPages: Math.ceil(totalPlayers / limit),
      currentPage: page
    };
  },

  async getProfile(req: Request, res: Response): Promise<Response> {
    const user = req.user as IUser; // User data is populated by Passport
    if (!user._id) { throw new CustomError(10); }

    const result = await User.findById(user._id, { password: 0 });
    if (!result) { throw new CustomError(40); }

    return res.send(result);
  }
};

export default UserService;