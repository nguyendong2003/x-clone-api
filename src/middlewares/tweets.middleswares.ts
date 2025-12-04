import { checkSchema } from 'express-validator'
import { ObjectId } from 'mongodb'
import { TweetAudience, TweetType } from '~/constants/enums'
import { HttpStatus } from '~/constants/httpStatus'
import { TweetsMessages } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import databaseService from '~/services/database.services'
import { numberEnumToArray } from '~/utils/common'
import { validate } from '~/utils/validation'

const tweetTypes = numberEnumToArray(TweetType)
const tweetAudiences = numberEnumToArray(TweetAudience)

export const tweetsValidator = validate(
  checkSchema({
    type: {
      isIn: {
        options: [tweetTypes],
        errorMessage: TweetsMessages.TWEET_TYPE_INVALID
      }
    },
    audience: {
      isIn: {
        options: [tweetAudiences],
        errorMessage: TweetsMessages.TWEET_AUDIENCE_INVALID
      }
    },
    parent_id: {
      custom: {
        options: (value, { req }) => {
          const { type } = req.body as { type: TweetType }

          // Nếu `type` là retweet, comment, quotetweet thì `parent_id` phải là `tweet_id` của tweet cha
          if ([TweetType.Retweet, TweetType.Comment, TweetType.QuoteTweet].includes(type) && !ObjectId.isValid(value)) {
            throw new Error(TweetsMessages.PARENT_ID_MUST_BE_VALID_TWEET_ID)
          }

          // nếu `type` là tweet thì `parent_id` phải là `null`
          if (type === TweetType.Tweet && value !== null) {
            throw new Error(TweetsMessages.PARENT_ID_MUST_BE_NULL)
          }

          return true
        }
      }
    },
    content: {
      isString: {
        errorMessage: TweetsMessages.TWEET_CONTENT_MUST_BE_STRING
      },
      trim: true,
      custom: {
        options: (value, { req }) => {
          const { type, hashtags, mentions } = req.body as { type: TweetType; hashtags: string[]; mentions: string[] }

          // Nếu `type` là retweet thì `content` phải là `''`
          if (type === TweetType.Retweet && value.trim() !== '') {
            throw new Error(TweetsMessages.TWEET_CONTENT_MUST_BE_STRING)
          }
          // Nếu `type` là comment, quotetweet, tweet và không có `mentions` và `hashtags` thì `content` phải là string và không được rỗng
          if (
            [TweetType.Comment, TweetType.QuoteTweet, TweetType.Tweet].includes(type) &&
            (!mentions || mentions.length === 0) &&
            (!hashtags || hashtags.length === 0) &&
            value.trim() === ''
          ) {
            throw new Error(TweetsMessages.TWEET_CONTENT_CANNOT_BE_EMPTY)
          }

          return true
        }
      }
    },
    hashtags: {
      isArray: {
        errorMessage: TweetsMessages.TWEET_HASHTAGS_MUST_BE_ARRAY
      },
      custom: {
        options: (value, { req }) => {
          // Yêu cầu mỗi phần tử trong mảng phải là string
          if (!value.every((item: any) => typeof item === 'string')) {
            throw new Error(TweetsMessages.TWEET_HASHTAGS_MUST_BE_ARRAY_OF_STRING)
          }

          return true
        }
      }
    },
    mentions: {
      isArray: {
        errorMessage: TweetsMessages.TWEET_MENTIONS_MUST_BE_ARRAY
      },
      custom: {
        options: (value, { req }) => {
          // Yêu cầu mỗi phần tử trong mảng phải là ObjectId
          if (!value.every((item: any) => ObjectId.isValid(item))) {
            throw new Error(TweetsMessages.TWEET_MENTIONS_MUST_BE_ARRAY_OF_USER_ID)
          }

          return true
        }
      }
    },
    medias: {
      isArray: {
        errorMessage: TweetsMessages.TWEET_MEDIAS_MUST_BE_ARRAY
      },
      custom: {
        options: (value, { req }) => {
          // Yêu cầu mỗi phần tử trong mảng phải là Media Object
          if (!value.every((item: any) => typeof item === 'object' && 'url' in item && 'type' in item)) {
            throw new Error(TweetsMessages.TWEET_MEDIAS_MUST_BE_ARRAY_OF_MEDIA_OBJECT)
          }

          return true
        }
      }
    }
  })
)

export const tweetIdValidator = validate(
  checkSchema(
    {
      tweet_id: {
        // isMongoId: {
        //   errorMessage: TweetsMessages.TWEET_ID_INVALID
        // },
        custom: {
          options: async (value, { req }) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                status: HttpStatus.BAD_REQUEST,
                message: TweetsMessages.TWEET_ID_INVALID
              })
            }

            const tweet = await databaseService.tweets.findOne({ _id: new ObjectId(value) })

            if (!tweet) {
              throw new ErrorWithStatus({
                status: HttpStatus.NOT_FOUND,
                message: TweetsMessages.TWEET_NOT_FOUND
              })
            }

            return true
          }
        }
      }
    },
    ['params', 'body']
  )
)
