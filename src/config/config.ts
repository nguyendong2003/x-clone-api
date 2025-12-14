// Kiểm tra xem có tham số --production trong command line không
import argv from 'minimist'

const options = argv(process.argv.slice(2))

export const isProduction = Boolean(options.production)

// config env variables
import { config } from 'dotenv'

config()

export const EnvConfig = {
  PORT: process.env.PORT as string,
  BASE_URL: process.env.BASE_URL as string,

  DB_CONNECTION: process.env.DB_CONNECTION as string,
  DB_NAME: process.env.DB_NAME as string,

  // Database Collections
  DB_USERS_COLLECTION: process.env.DB_USERS_COLLECTION as string,
  DB_REFRESH_TOKENS_COLLECTION: process.env.DB_REFRESH_TOKENS_COLLECTION as string,
  DB_FOLLOWERS_COLLECTION: process.env.DB_FOLLOWERS_COLLECTION as string,
  DB_VIDEO_STATUS_COLLECTION: process.env.DB_VIDEO_STATUS_COLLECTION as string,
  DB_TWEETS_COLLECTION: process.env.DB_TWEETS_COLLECTION as string,
  DB_HASHTAGS_COLLECTION: process.env.DB_HASHTAGS_COLLECTION as string,
  DB_BOOKMARKS_COLLECTION: process.env.DB_BOOKMARKS_COLLECTION as string,
  DB_LIKES_COLLECTION: process.env.DB_LIKES_COLLECTION as string,
  DB_CONVERSATIONS_COLLECTION: process.env.DB_CONVERSATIONS_COLLECTION as string,

  // Password & JWT Secrets
  PASSWORD_SECRET: process.env.PASSWORD_SECRET as string,
  JWT_SECRET_ACCESS_TOKEN: process.env.JWT_SECRET_ACCESS_TOKEN as string,
  JWT_SECRET_REFRESH_TOKEN: process.env.JWT_SECRET_REFRESH_TOKEN as string,
  JWT_SECRET_EMAIL_VERIFY_TOKEN: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string,
  JWT_SECRET_FORGOT_PASSWORD_TOKEN: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string,

  // Token Expiration
  ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN as string,
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN as string,
  EMAIL_VERIFY_TOKEN_EXPIRES_IN: process.env.EMAIL_VERIFY_TOKEN_EXPIRES_IN as string,
  FORGOT_PASSWORD_TOKEN_EXPIRES_IN: process.env.FORGOT_PASSWORD_TOKEN_EXPIRES_IN as string,

  // Google OAuth
  GOOGLE_OAUTH_CLIENT_ID: process.env.GOOGLE_OAUTH_CLIENT_ID as string,
  GOOGLE_OAUTH_CLIENT_SECRET: process.env.GOOGLE_OAUTH_CLIENT_SECRET as string,
  GOOGLE_OAUTH_REDIRECT_URI: process.env.GOOGLE_OAUTH_REDIRECT_URI as string,
  CLIENT_REDIRECT_CALLBACK_URL: process.env.CLIENT_REDIRECT_CALLBACK_URL as string,

  // Client URLs
  CLIENT_BASE_URL: process.env.CLIENT_BASE_URL as string,

  // AWS Config
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID as string,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY as string,
  AWS_REGION: process.env.AWS_REGION as string,
  AWS_SES_FROM_ADDRESS: process.env.AWS_SES_FROM_ADDRESS as string,
  AWS_S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME as string
}
