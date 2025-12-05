import { NextFunction, Request, Response } from 'express'
import { checkSchema } from 'express-validator'
import { ObjectId } from 'mongodb'
import { TweetAudience, TweetType, UserVerifyStatus } from '~/constants/enums'
import { HttpStatus } from '~/constants/httpStatus'
import { TweetsMessages, UsersMessages } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import { TokenPayload } from '~/models/requests/User.requests'
import Tweet from '~/models/schemas/Tweet.schemas'
import databaseService from '~/services/database.services'
import { numberEnumToArray } from '~/utils/common'
import { wrapRequestHandler } from '~/utils/handlers'
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

            // const tweet = await databaseService.tweets.findOne({ _id: new ObjectId(value) })

            const tweet = await databaseService.tweets
              .aggregate<Tweet>([
                {
                  $match: {
                    _id: new ObjectId(value)
                  }
                },
                {
                  $lookup: {
                    from: 'hashtags',
                    localField: 'hashtags',
                    foreignField: '_id',
                    as: 'hashtags'
                  }
                },
                {
                  $addFields: {
                    mentions: {
                      $map: {
                        input: '$mentions',
                        as: 'mention',
                        in: {
                          _id: '$$mention._id',
                          name: '$$mention.name',
                          username: '$$mention.username',
                          email: '$$mention.email'
                        }
                      }
                    }
                  }
                },
                {
                  $lookup: {
                    from: 'bookmarks',
                    localField: '_id',
                    foreignField: 'tweet_id',
                    as: 'bookmarks'
                  }
                },
                {
                  $lookup: {
                    from: 'likes',
                    localField: '_id',
                    foreignField: 'tweet_id',
                    as: 'likes'
                  }
                },
                {
                  $lookup: {
                    from: 'tweets',
                    localField: '_id',
                    foreignField: 'parent_id',
                    as: 'tweet_children'
                  }
                },
                {
                  $addFields: {
                    bookmarks: {
                      $size: '$bookmarks'
                    },
                    likes: {
                      $size: '$likes'
                    },
                    retweet_count: {
                      $size: {
                        $filter: {
                          input: '$tweet_children',
                          as: 'item',
                          cond: {
                            $eq: ['$$item.type', TweetType.Retweet]
                          }
                        }
                      }
                    },
                    comment_count: {
                      $size: {
                        $filter: {
                          input: '$tweet_children',
                          as: 'item',
                          cond: {
                            $eq: ['$$item.type', TweetType.Comment]
                          }
                        }
                      }
                    },
                    quote_count: {
                      $size: {
                        $filter: {
                          input: '$tweet_children',
                          as: 'item',
                          cond: {
                            $eq: ['$$item.type', TweetType.QuoteTweet]
                          }
                        }
                      }
                    }
                  }
                },
                {
                  $project: {
                    tweet_children: 0
                  }
                }
              ])
              .toArray()
              .then((results) => results[0])

            if (!tweet) {
              throw new ErrorWithStatus({
                status: HttpStatus.NOT_FOUND,
                message: TweetsMessages.TWEET_NOT_FOUND
              })
            }

            ;(req as Request).tweet = tweet

            return true
          }
        }
      }
    },
    ['params', 'body']
  )
)

// Muốn sử dụng async await trong handler express middleware thì phải có try-catch
// Nếu không muốn dùng try-catch thì phải dùng wrapRequestHandler
export const audienceValidator = wrapRequestHandler(async (req: Request, res: Response, next: NextFunction) => {
  const tweet = req.tweet as Tweet
  if (tweet.audience === TweetAudience.TwitterCircle) {
    // Kiểm tra người xem tweet này đã đăng nhập hay chưa
    if (!req.decoded_authorization) {
      throw new ErrorWithStatus({
        status: HttpStatus.UNAUTHORIZED,
        message: UsersMessages.ACCESS_TOKEN_IS_REQUIRED
      })
    }

    // Kiểm tra tài khoản tác giả có bị khóa hay bị xóa hay không
    const author = await databaseService.users.findOne({ _id: tweet.user_id })
    if (!author || author.verify === UserVerifyStatus.Banned) {
      throw new ErrorWithStatus({
        status: HttpStatus.NOT_FOUND,
        message: UsersMessages.USER_NOT_FOUND
      })
    }

    // Kiểm tra người xem tweet này có trong twitter circle của tác giả hay không
    const { user_id } = req.decoded_authorization as TokenPayload
    const isInTwitterCircle = author.twitter_circle.some((userId) => userId.equals(new ObjectId(user_id)))
    // Nếu bạn không phải là tác giả và không nằm trong twitter circle của tác giả thì không được xem tweet này
    if (!author._id.equals(new ObjectId(user_id)) && !isInTwitterCircle) {
      throw new ErrorWithStatus({
        status: HttpStatus.FORBIDDEN,
        message: TweetsMessages.TWEET_NOT_PUBLIC
      })
    }
  }
  next()
})
