import { TweetAudience, TweetType } from '~/constants/enums'
import { Media } from '~/models/Other'
import { ParamsDictionary } from 'express-serve-static-core'
import { ParsedQs } from 'qs'

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

export interface TweetChildrenQuery extends ParsedQs {
  tweet_type: string
  limit: string
  page: string
}
