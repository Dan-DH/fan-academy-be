import { configDotenv } from "dotenv";

configDotenv({ path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env' });