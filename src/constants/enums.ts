export enum UserVerifyStatus {
  Unverified, // chưa xác thực email, mặc định = 0
  Verified, // đã xác thực email
  Banned // bị khóa
}

export enum TokenType {
  AccessToken,
  RefreshToken,
  EmailVerifyToken,
  ForgotPasswordToken
}

export enum MediaType {
  Image,
  Video,
  VideoHLS
}

export enum VideoEncodeStatus {
  Pending, // Đang chở ở hàng đợi
  Processing, // Đang được encoding
  Success, // Đã encoding thành công
  Failed // Quá trình encoding thất bại
}

export enum TweetType {
  Tweet, // tự đăng bài
  Retweet, // Reweet giống như là chia sẻ giống bên Facebook (chỉ chia sẻ, không thêm comment vào)
  Comment, // bình luận
  QuoteTweet // QuoteTweet giống như là chia sẻ bên Facebook (nhưng có thêm comment vào)
}

export enum TweetAudience {
  Everyone, // 0
  TwitterCircle // 1
}

// Mục đích để search
export enum MediaTypeQuery {
  Image = 'image',
  Video = 'video'
}

export enum PeopleFollowQuery {
  Anyone = '0',
  Following = '1'
}
