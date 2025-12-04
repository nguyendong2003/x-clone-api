import { TweetReqBody } from '~/models/requests/Tweet.requests'
import databaseService from './database.services'
import Tweet from '~/models/schemas/Tweet.schemas'
import Hashtag from '~/models/schemas/Hashtag.schemas'
import { ObjectId } from 'mongodb'

class TweetsService {
  async checkAndCreateHashtag(hashtags: string[]) {
    // Tìm hashtag trong database, nếu có thì lấy ra, không có thì tạo mới
    const hashtagsDocuments = await Promise.all(
      hashtags.map((hashtag) => {
        return databaseService.hashtags.findOneAndUpdate(
          { name: hashtag },
          {
            $setOnInsert: new Hashtag({ name: hashtag })
          },
          {
            upsert: true,
            returnDocument: 'after'
          }
        )
      })
    )

    return hashtagsDocuments
  }

  async createTweet(user_id: string, body: TweetReqBody) {
    const hashtags = await this.checkAndCreateHashtag(body.hashtags)
    const result = await databaseService.tweets.insertOne(
      new Tweet({
        user_id: user_id,
        type: body.type,
        audience: body.audience,
        content: body.content,
        parent_id: body.parent_id,
        hashtags: hashtags.map((hashtag) => hashtag?._id as ObjectId),
        mentions: body.mentions,
        medias: body.medias
      })
    )
    return result
  }
}

const tweetsService = new TweetsService()

export default tweetsService
