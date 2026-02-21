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
  councilWins: {
    type: Number,
    required: true,
    default: 0
  },
  elvesWins: {
    type: Number,
    required: true,
    default: 0
  },
  dwarvesWins: {
    type: Number,
    required: true,
    default: 0
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
  }
});

const User = model<IUser>('User', UserSchema);

export default User;
