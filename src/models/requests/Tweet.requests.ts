import { TweetAudience, TweetType } from '~/constants/enums'
import { Media } from '~/models/Other'

export interface TweetReqBody {
  type: TweetType
  audience: TweetAudience
  content: string
  parent_id: null | string // chỉ null khi tweet gốc, không thì tweet_id cha dạng string
  hashtags: string[] // tên của hashtag dạng ['javascript', 'react']
  mentions: string[] // user_id[]
  medias: Media[]
}
