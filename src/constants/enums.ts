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
