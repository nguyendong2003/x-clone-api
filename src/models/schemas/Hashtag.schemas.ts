import { ObjectId } from 'mongodb'

interface HashtagType {
  _id?: ObjectId
  name: string
  created_at?: Date
}

export default class Hashtag {
  _id?: ObjectId
  name: string
  created_at: Date

  constructor({ _id, name, created_at }: HashtagType) {
    this._id = _id || new ObjectId() // Tự tạo ObjectId nếu không có
    this.name = name
    this.created_at = created_at || new Date()
  }
}
