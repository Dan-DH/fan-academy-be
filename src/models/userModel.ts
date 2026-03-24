import { model, Schema } from 'mongoose';
import IUser from '../interfaces/userInterface';

const PreferencesSchema = new Schema({
  emailNotifications: {
    type: Boolean,
    required: true,
    default: true
  },
  chat: {
    type: Boolean,
    required: true,
    default: true
  },
  sound: {
    type: Boolean,
    required: true,
    default: true
  }
});

const OpponentFactionWinStats = new Schema({
  crystal: {
    type: Number,
    required: true,
    default: 0
  },
  hero: {
    type: Number,
    required: true,
    default: 0
  },
  timeout: {
    type: Number,
    required: true,
    default: 0
  },
  conceded: {
    type: Number,
    required: true,
    default: 0
  }
});

const OpponentFactiontats = new Schema({
  games: {
    type: Number,
    required: true,
    default: 0
  },
  totalWins: {
    type: Number,
    required: true,
    default: 0
  },
  totalLoses: {
    type: Number,
    required: true,
    default: 0
  },
  wins: {
    type: OpponentFactionWinStats,
    required: true
  },
  loses: {
    type: OpponentFactionWinStats,
    required: true
  }
});

const OpponentFactions = new Schema({
  council: {
    type: OpponentFactiontats,
    required: true
  },
  elves: {
    type: OpponentFactiontats,
    required: true
  },
  dwarves: {
    type: OpponentFactiontats,
    required: true
  }
});

const FactionStatsSchema = new Schema({
  games: {
    type: Number,
    required: true,
    default: 0
  },
  wins: {
    type: Number,
    required: true,
    default: 0
  },
  loses: {
    type: Number,
    required: true,
    default: 0
  },
  rating: {
    type: Number,
    required: true,
    default: 1500
  },
  opponentFactions: {
    type: OpponentFactions,
    required: true
  }
});

const FactionsSchema = new Schema({
  council: {
    type: FactionStatsSchema,
    required: true
  },
  elves: {
    type: FactionStatsSchema,
    required: true
  },
  dwarves: {
    type: FactionStatsSchema,
    required: true
  }
});

const StatsSchema = new Schema({
  totalGames: {
    type: Number,
    required: true,
    default: 0
  },
  totalWins: {
    type: Number,
    required: true,
    default: 0
  },
  totalLoses: {
    type: Number,
    required: true,
    default: 0
  },
  factions: {
    type: FactionsSchema,
    required: true
  }
});

const UserSchema = new Schema({
  username: {
    type: String,
    minLength: 2,
    maxLength: 20,
    required: true
  },
  password: {
    type: String,
    required: false
  },
  email: {
    type: String,
    match: [/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/, 'Please fill in a valid email address']
  },
  picture: String,
  lastSeen: Date,
  preferences: PreferencesSchema,
  stats: StatsSchema,
  emailConfirmationLink: {
    type: String,
    required: false
  },
  confirmedEmail: {
    type: Boolean,
    required: true,
    default: false
  },
  turnEmailSent: {
    type: Boolean,
    required: true,
    default: false
  },
  recoveryCode: {
    type: String,
    required: false
  }
});

const User = model<IUser>('User', UserSchema);

export default User;
