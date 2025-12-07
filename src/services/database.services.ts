import { Collection, Db, MongoClient } from 'mongodb'
import { config } from 'dotenv'
import User from '~/models/schemas/User.schemas'
import RefreshToken from '~/models/schemas/RefreshToken.schemas'
import Follower from '~/models/schemas/Follower.schemas'
import VideoStatus from '~/models/schemas/VideoStatus.schemas'
import Tweet from '~/models/schemas/Tweet.schemas'
import Hashtag from '~/models/schemas/Hashtag.schemas'
import Bookmark from '~/models/schemas/Bookmark.schemas'

config()

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.m3n5vlw.mongodb.net/?appName=Cluster0`

class DatabaseService {
  private client: MongoClient
  private db: Db

  constructor() {
    this.client = new MongoClient(uri)
    this.db = this.client.db(process.env.DB_NAME)
  }

  async connect() {
    try {
      await this.db.command({ ping: 1 })
      console.log('Pinged your deployment. You successfully connected to MongoDB!')
    } catch (error) {
      console.log('Error: ', error)
      throw error
    }
  }

  async indexUsers() {
    // Kiểm tra nếu index chưa tồn tại thì tạo mới để tránh khi restart server lại đánh index => lỗi không đáng có
    const exists = await this.users.indexExists(['email_1_password_1', 'username_1', 'email_1'])
    if (exists) return

    this.users.createIndex({ email: 1, password: 1 })
    this.users.createIndex({ email: 1 }, { unique: true })
    this.users.createIndex({ username: 1 }, { unique: true })
  }

  async indexRefreshTokens() {
    const exists = await this.refreshTokens.indexExists(['token_1', 'exp_1'])
    if (exists) return

    this.refreshTokens.createIndex({ token: 1 }) // Tạo index cho trường token
    this.refreshTokens.createIndex({ exp: 1 }, { expireAfterSeconds: 0 }) // Tạo TTL index cho trường exp (sau 0 giây kể từ thời điểm trong trường exp, tài liệu sẽ tự động bị xóa)
  }

  async indexVideoStatus() {
    const exists = await this.videoStatus.indexExists(['name_1'])
    if (exists) return

    this.videoStatus.createIndex({ name: 1 })
  }

  async indexFollowers() {
    const exists = await this.followers.indexExists(['userId_1_followed_user_id_1'])
    if (exists) return

    this.followers.createIndex({ userId: 1, followed_user_id: 1 }, { unique: true })
  }

  async indexTweets() {
    const exists = await this.tweets.indexExists(['content_text'])
    if (!exists) {
      // Tạo text index cho trường content để phục vụ chức năng search tweet
      // Mặc định ngôn ngữ là "english", để tắt tính năng lọc stop words và stemming, ta đặt về "none"
      // Nếu để mặc định là "english" thì khi search các stop words như "is", "the", "and"... sẽ không ra kết quả
      this.tweets.createIndex({ content: 'text' }, { default_language: 'none' })
    }
  }

  get users(): Collection<User> {
    return this.db.collection(process.env.DB_USERS_COLLECTION as string)
  }

  get refreshTokens(): Collection<RefreshToken> {
    return this.db.collection(process.env.DB_REFRESH_TOKENS_COLLECTION as string)
  }

  get followers(): Collection<Follower> {
    return this.db.collection(process.env.DB_FOLLOWERS_COLLECTION as string)
  }

  get videoStatus(): Collection<VideoStatus> {
    return this.db.collection(process.env.DB_VIDEO_STATUS_COLLECTION as string)
  }

  get tweets(): Collection<Tweet> {
    return this.db.collection(process.env.DB_TWEETS_COLLECTION as string)
  }

  get hashtags(): Collection<Hashtag> {
    return this.db.collection(process.env.DB_HASHTAGS_COLLECTION as string)
  }

  get bookmarks(): Collection<Bookmark> {
    return this.db.collection(process.env.DB_BOOKMARKS_COLLECTION as string)
  }
}

const databaseService = new DatabaseService()

export default databaseService
