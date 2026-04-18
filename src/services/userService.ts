import { hash } from 'bcrypt';
import { Request, Response } from "express";
import { NextFunction } from 'express-serve-static-core';
import { CustomError } from '../classes/customError';
import { EGameStatus } from '../enums/game.enums';
import IUser from "../interfaces/userInterface";
import Game from "../models/gameModel";
import User from "../models/userModel";
import { generateToken } from '../middleware/jwt';
import { generateConfirmationLink, generateRecoveryCode } from '../utils/tokenGeneration';
import { EmailService } from '../emails/emailService';
import { ELeaderboardEnum } from '../enums/leaderboard.enums';
import { getProfilePaginationSortOrder } from '../utils/gameUtils';
import { ObjectId } from 'mongoose';

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
    const emailConfirmationLink = generateConfirmationLink();
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
        ...statsObject(),
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
          username: user.username,
          portrait: user.portrait,
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
      }, { runValidators: true });
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

    const result = await User.findByIdAndUpdate(user._id, updateFields, {
      new: true,
      runValidators: true
    });

    if (!result) throw new CustomError(41);

    return res.send(result);
  },

  async deleteUser(userId: string, next: NextFunction): Promise<{
    users: {
      _id: ObjectId,
      email: string
    }[],
    deletedUserId: string
  } | void > {
    try{
      const affectedGames = await Game.find(
        {
          'players.userId': userId,
          status: { $nin: [EGameStatus.SEARCHING, EGameStatus.FINISHED] }
        },
        {
          gameStatus: 1,
          players: 1
        }
      ).lean();

      if (!affectedGames.length) return;

      const userIdsToUpdate = [...new Set(affectedGames.flatMap(g => g.players).map(p => p.userId).filter(id => id && id !== userId))];

      const usersToNotify = await User.find({
        _id: { $in: Array.from(userIdsToUpdate) },
        'preferences.emailNotifications': { $ne: false },
        confirmedEmail: { $ne: false }
      }, {
        _id: 1,
        email: 1
      }).lean() as unknown as {
        _id: ObjectId, // TODO: might be an objectid
        email: string
      }[];

      console.log('userEmails', usersToNotify); // FIXME: check and remove

      const result = {
        users: usersToNotify,
        deletedUserId: userId
      };

      Game.deleteMany({ 'players.userId': userId }); // fnf. We also remove finished games
      User.findOneAndDelete({ _id: userId }); // fnf

      // await DiscordNotificationService.sendGameDeleted(username);
      return result;
    } catch (err) {
      console.log(err);
      next(err);
    }
  },

  async getLeaderboard(boardType: ELeaderboardEnum,  page: number): Promise<{
    players: IUser[],
    totalPages: number,
    currentPage: number
  }> {
    const limit = 12;
    const skip = (page - 1) * limit;

    const sortType = getProfilePaginationSortOrder(boardType);

    const players = await User.find({}, {
      username: 1,
      portrait: 1,
      stats: 1
    }).sort(sortType).skip(skip).limit(limit);

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
  },

  async passwordRecovery(req: Request, next: NextFunction): Promise<void> {
    try {
      const email = req.body.email.trim();

      const user = await User.findOne({
        email,
        confirmedEmail: true
      }, {
        username: 1,
        email: 1
      });
      if (!user) { throw new CustomError(40); }

      const recoveryCode = generateRecoveryCode();

      user.recoveryCode = recoveryCode;
      await user.save();

      await EmailService.sendPasswordRecoveryEmail(email, user.username, recoveryCode);
    } catch (error) {
      next(error);
    }
  },

  async passwordReset(req: Request, next: NextFunction): Promise<void> {
    try {
      const recoveryCode = req.body.recoveryCode.trim();
      const password = req.body.password.trim();

      if (!recoveryCode || recoveryCode.length !== 6 || !password) throw new CustomError(31);

      const hashedPassword = await hash(password, 10);

      const user = await User.findOneAndUpdate(
        { recoveryCode },
        {
          $set: { password: hashedPassword },
          $unset: { recoveryCode: "" }
        },
        { runValidators: true }
      );
      if (!user) { throw new CustomError(40); }
    } catch (error) {
      next(error);
    }
  }
};

function statsObject() {
  return {
    stats: {
      factions: {
        council: {
          opponentFactions: {
            council: {
              wins: {},
              loses: {}
            },
            elves: {
              wins: {},
              loses: {}
            },
            dwarves: {
              wins: {},
              loses: {}
            }
          }
        },
        elves: {
          opponentFactions: {
            council: {
              wins: {},
              loses: {}
            },
            elves: {
              wins: {},
              loses: {}
            },
            dwarves: {
              wins: {},
              loses: {}
            }
          }
        },
        dwarves: {
          opponentFactions: {
            council: {
              wins: {},
              loses: {}
            },
            elves: {
              wins: {},
              loses: {}
            },
            dwarves: {
              wins: {},
              loses: {}
            }
          }
        }
      }
    }
  };
}

export default UserService;