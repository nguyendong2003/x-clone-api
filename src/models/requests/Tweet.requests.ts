import { TweetAudience, TweetType } from '~/constants/enums'
import { Media } from '~/models/Other'
import { ParamsDictionary, Query } from 'express-serve-static-core'

export interface TweetReqBody {
  type: TweetType
  audience: TweetAudience
  content: string
  parent_id: null | string // chỉ null khi tweet gốc, không thì tweet_id cha dạng string
  hashtags: string[] // tên của hashtag dạng ['javascript', 'react']
  mentions: string[] // user_id[]
  medias: Media[]
}

export interface TweetChildrenParams extends ParamsDictionary {
  tweet_id: string
}

// Query parameters are always strings in Express, cannot change to number or enum
export interface TweetChildrenQuery extends PaginationQuery {
  tweet_type: string
}

export interface PaginationQuery extends Query {
  limit: string
  page: string
}
