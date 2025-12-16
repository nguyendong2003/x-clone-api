# XClone API

A social media platform backend built with **Node.js**, **TypeScript**, **Express**, and **MongoDB**.

![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Environment Variables](#-environment-variables)
- [Running](#-running)
- [API Documentation](#-api-documentation)
- [Deployment](#-deployment)

## ✨ Features

### Authentication

- JWT-based auth (access & refresh tokens)
- Google OAuth 2.0
- Email verification & password reset
- Profile management

### Social

- Follow/unfollow users
- Customizable profiles (bio, avatar, cover photo, username)

### Tweets

- Create, retweet, comment, quote tweet
- Audience control (Everyone/Twitter Circle)
- Hashtags, mentions, media attachments
- Like, bookmark, view counts
- Newsfeed with pagination

### Search & Chat

- Full-text tweet search with filters (media type, following)
- Real-time WebSocket chat (Socket.io)

### Media

- **Images**: Multi-upload, Sharp optimization, S3 storage
- **Videos**: Standard upload, HTTP range streaming, S3 storage
- **HLS**: Automatic ffmpeg encoding (720p/1080p/1440p), status tracking

### Security

- Helmet, cors, rate limiting (100 req/15min)
- Password hashing, input validation

## 🚀 Tech Stack

**Backend**: Node.js, TypeScript, Express.js  
**Database**: MongoDB  
**Auth**: JWT, OAuth 2.0 (Google), bcrypt  
**Media**: ffmpeg (HLS), sharp (images), AWS S3  
**Real-time**: Socket.io  
**Email**: AWS SES  
**Security**: Helmet, cors, express-rate-limit  
**Dev/Ops**: Docker, PM2, Nodemon, ESLint, Prettier  
**Docs**: Swagger/OpenAPI 3.0

## 🔑 Environment Variables

Create `.env.development` / `.env.production` / `.env.staging`:

```env
# Server
PORT=4000
BASE_URL=http://localhost:4000
CLIENT_BASE_URL=http://localhost:3000

# Database
DB_CONNECTION=mongodb://localhost:27017
DB_NAME=xclone

# JWT Secrets
JWT_SECRET_ACCESS_TOKEN=your-secret
JWT_SECRET_REFRESH_TOKEN=your-secret
JWT_SECRET_EMAIL_VERIFY_TOKEN=your-secret
JWT_SECRET_FORGOT_PASSWORD_TOKEN=your-secret

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-secret
GOOGLE_REDIRECT_URI=http://localhost:4000/users/oauth/google
CLIENT_REDIRECT_CALLBACK=http://localhost:3000/login/oauth

# AWS
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-bucket
AWS_SES_FROM_ADDRESS=noreply@yourdomain.com
```

## 🏃 Running

```bash
# Development
npm run dev

# Production
npm run build
npm start

# With PM2
npm run build
pm2 start ecosystem.config.js --env production

# Docker
docker build -t xclone-backend .
docker run -p 4000:3000 xclone-backend
```

## 📚 API Documentation

Access Swagger UI to explore and test the API:

- **Development**: `http://localhost:4000/api-docs`
- **Production**: `https://nguyendong.io.vn/api-docs`

### Key Endpoints

**Auth**: `/users/register`, `/users/login`, `/users/oauth/google`, `/users/logout`, `/users/refresh-token`  
**Profile**: `/users/me` (GET/PATCH), `/users/:username`, `/users/follow`, `/users/change-password`  
**Tweets**: `/tweets` (POST/GET), `/tweets/:tweet_id`, `/tweets/:tweet_id/children`  
**Interactions**: `/likes`, `/bookmarks`  
**Search**: `/search`  
**Chat**: `/conversations/receivers/:receiver_id`  
**Media**: `/medias/upload-image`, `/medias/upload-video`, `/medias/upload-video-hls`, `/medias/video-status/:id`  
**Static**: `/static/image/:name`, `/static/video-stream/:name`, `/static/video-hls/:id/master.m3u8`

## 🚢 Deployment

### PM2

```bash
npm run build
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### Docker

```bash
docker build -t xclone-backend .
docker run -d -p 4000:3000 --name xclone xclone-backend
```
