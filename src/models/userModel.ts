import { model, Schema } from 'mongoose';
import IUser from '../interfaces/userInterface';

const PreferencesSchema = new Schema({
  emailNotifications: {
    type: Boolean,
    default: true
  },
  chat: {
    type: Boolean,
    default: true
  },
  sound: {
    type: Boolean,
    default: true
  }
});

const OpponentFactionWinStats = new Schema({
  crystal: {
    type: Number,
    default: 0
  },
  hero: {
    type: Number,
    default: 0
  },
  timeout: {
    type: Number,
    default: 0
  },
  conceded: {
    type: Number,
    default: 0
  }
});

const OpponentFactiontats = new Schema({
  games: {
    type: Number,
    default: 0
  },
  totalWins: {
    type: Number,
    default: 0
  },
  totalLoses: {
    type: Number,
    default: 0
  },
  wins: OpponentFactionWinStats,
  loses: OpponentFactionWinStats
});

const OpponentFactions = new Schema({
  council: OpponentFactiontats,
  elves: OpponentFactiontats,
  dwarves: OpponentFactiontats
});

const FactionStatsSchema = new Schema({
  games: {
    type: Number,
    default: 0
  },
  wins: {
    type: Number,
    default: 0
  },
  loses: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 1500
  },
  opponentFactions: OpponentFactions
});

const FactionsSchema = new Schema({
  council: FactionStatsSchema,
  elves: FactionStatsSchema,
  dwarves: FactionStatsSchema
});

const StatsSchema = new Schema({
  totalGames: {
    type: Number,
    default: 0
  },
  totalWins: {
    type: Number,
    default: 0
  },
  totalLoses: {
    type: Number,
    default: 0
  },
  factions: FactionsSchema
});

const UserSchema = new Schema({
  username: {
    type: String,
    minLength: 2,
    maxLength: 20,
    required: true
  },
  password: String,
  email: {
    type: String,
    match: [/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/, 'Please fill in a valid email address']
  },
  portrait: String,
  lastSeen: Date,
  preferences: PreferencesSchema,
  stats: StatsSchema,
  emailConfirmationLink: String,
  confirmedEmail: {
    type: Boolean,
    default: false
  },
  turnEmailSent: {
    type: Boolean,
    default: false
  },
  recoveryCode: String
});

const User = model<IUser>('User', UserSchema);

export default User;
