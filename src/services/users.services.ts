import { TokenType, UserVerifyStatus } from '~/constants/enums'
import { RegisterReqBody, TokenPayload, UpdateMeReqBody } from '~/models/requests/User.requests'
import User from '~/models/schemas/User.schemas'
import databaseService from '~/services/database.services'
import { hashPassword } from '~/utils/crypto'
import { signToken, verifyToken } from '~/utils/jwt'
import { StringValue } from 'ms'
import RefreshToken from '~/models/schemas/RefreshToken.schemas'
import { ObjectId } from 'mongodb'
import { config } from 'dotenv'
import Follower from '~/models/schemas/Follower.schemas'
import axios from 'axios'
import { ErrorWithStatus } from '~/models/Errors'
import { UsersMessages } from '~/constants/messages'
import { HttpStatus } from '~/constants/httpStatus'

config()

type SignTokenPayload = {
  user_id: string
  verify: UserVerifyStatus
  exp?: number
}

class UsersService {
  private signAccessToken({ user_id, verify }: SignTokenPayload) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.AccessToken,
        verify
      },
      privateKey: process.env.JWT_SECRET_ACCESS_TOKEN as string,
      options: {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN as StringValue
      }
    })
  }

  private signRefreshToken({ user_id, verify, exp }: SignTokenPayload) {
    if (exp) {
      return signToken({
        payload: {
          user_id,
          token_type: TokenType.RefreshToken,
          verify,
          exp
        },
        privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string
      })
    }

    return signToken({
      payload: {
        user_id,
        token_type: TokenType.RefreshToken,
        verify
      },
      privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string,
      options: {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN as StringValue
      }
    })
  }

  private signAccessTokenAndRefreshToken({ user_id, verify }: SignTokenPayload) {
    return Promise.all([this.signAccessToken({ user_id, verify }), this.signRefreshToken({ user_id, verify })])
  }

  private signEmailVerifyToken({ user_id, verify }: SignTokenPayload) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.EmailVerifyToken,
        verify
      },
      privateKey: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string,
      options: {
        expiresIn: process.env.EMAIL_VERIFY_TOKEN_EXPIRES_IN as StringValue
      }
    })
  }

  private signForgotPasswordToken({ user_id, verify }: SignTokenPayload) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.ForgotPasswordToken,
        verify
      },
      privateKey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string,
      options: {
        expiresIn: process.env.FORGOT_PASSWORD_TOKEN_EXPIRES_IN as StringValue
      }
    })
  }

  private decodeRefreshToken(refresh_token: string) {
    return verifyToken({
      token: refresh_token,
      secretOrPublicKey: process.env.JWT_SECRET_REFRESH_TOKEN as string
    })
  }

  async register(payload: RegisterReqBody) {
    const user_id = new ObjectId()
    const email_verify_token = await this.signEmailVerifyToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified
    })
    const result = await databaseService.users.insertOne(
      new User({
        ...payload,
        _id: user_id,
        email_verify_token,
        date_of_birth: new Date(payload.date_of_birth), // Convert ISO8601 string to Date object
        password: hashPassword(payload.password),
        username: `user${user_id.toString()}` // Tạo username ngẫu nhiên dạng user_xxxxxxxx
      })
    )

    const [access_token, refresh_token] = await this.signAccessTokenAndRefreshToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified
    })

    const { iat, exp } = await this.decodeRefreshToken(refresh_token)

    await databaseService.refreshTokens.insertOne(
      new RefreshToken({ user_id: result.insertedId, token: refresh_token, iat, exp })
    )

    return {
      access_token,
      refresh_token
    }
  }

  // Lấy thông tin user bao gồm các trường nhạy cảm
  async getUserById(user_id: string) {
    const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
    return user
  }

  // Lấy thông tin user không bao gồm các trường nhạy cảm
  async getUserByIdPublic(user_id: string) {
    // dùng projection để không lấy các trường nhạy cảm
    const user = await databaseService.users.findOne(
      { _id: new ObjectId(user_id) },
      {
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    )
    return user
  }

  async getUserByUsernamePublic(username: string) {
    // dùng projection để không lấy các trường nhạy cảm
    const user = await databaseService.users.findOne(
      { username },
      {
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    )
    return user
  }

  async checkEmailExist(email: string) {
    const user = await databaseService.users.findOne({ email })
    return Boolean(user)
  }

  private async getOAuthGoogleToken(code: string) {
    const body = {
      code,
      client_id: process.env.GOOGLE_OAUTH_CLIENT_ID,
      client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT_URI,
      grant_type: 'authorization_code'
    }

    const { data } = await axios.post('https://oauth2.googleapis.com/token', body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })

    return data as {
      access_token: string
      expires_in: number
      refresh_token: string
      scope: string
      token_type: string
      id_token: string
    }
  }

  private async getGoogleUserInfo(access_token: string) {
    const { data } = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    })
    return data as {
      id: string
      email: string
      verified_email: boolean
      name: string
      given_name: string
      family_name: string
      picture: string
      locale: string
    }
  }

  async oauthGoogle(code: string) {
    const { access_token } = await this.getOAuthGoogleToken(code)
    const userInfo = await this.getGoogleUserInfo(access_token)
    if (!userInfo.verified_email) {
      throw new ErrorWithStatus({
        message: UsersMessages.GMAIL_NOT_VERIFIED,
        status: HttpStatus.BAD_REQUEST
      })
    }

    // Kiểm tra email đã đăng ký chưa
    const user = await databaseService.users.findOne({ email: userInfo.email })
    // Nếu tồn tại thì login vào hệ thống.
    if (user) {
      const [access_token, refresh_token] = await this.signAccessTokenAndRefreshToken({
        user_id: user._id.toString(),
        verify: user.verify
      })

      const { iat, exp } = await this.decodeRefreshToken(refresh_token)

      await databaseService.refreshTokens.insertOne(
        new RefreshToken({ user_id: user._id, token: refresh_token, iat, exp })
      )

      return {
        access_token,
        refresh_token,
        newUser: false,
        verify: user.verify
      }
    } else {
      // Ngược lại thì đăng ký tài khoản mới
      // Random password vì user sẽ không dùng password để login
      const randomPassword = Math.random().toString(36).slice(-8)

      const data = await this.register({
        name: userInfo.name,
        email: userInfo.email,
        password: randomPassword,
        confirm_password: randomPassword,
        date_of_birth: new Date().toISOString() // Set date_of_birth tạm thời là ngày hiện tại,
      })

      return {
        ...data,
        newUser: true,
        verify: UserVerifyStatus.Unverified
      }
    }
  }

  async login({ user_id, verify }: SignTokenPayload) {
    const [access_token, refresh_token] = await this.signAccessTokenAndRefreshToken({ user_id, verify })

    const { iat, exp } = await this.decodeRefreshToken(refresh_token)

    await databaseService.refreshTokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id), token: refresh_token, iat, exp })
    )
    return {
      access_token,
      refresh_token
    }
  }

  async logout(refresh_token: string) {
    const result = await databaseService.refreshTokens.deleteOne({ token: refresh_token })
    return result
  }

  async refreshToken({
    user_id,
    verify,
    refresh_token,
    exp
  }: {
    user_id: string
    verify: UserVerifyStatus
    refresh_token: string
    exp: number
  }) {
    const [new_access_token, new_refresh_token] = await Promise.all([
      this.signAccessToken({ user_id, verify }),
      this.signRefreshToken({ user_id, verify, exp }),
      databaseService.refreshTokens.deleteOne({ token: refresh_token })
    ])

    const decoded_refresh_token = await this.decodeRefreshToken(new_refresh_token)

    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        user_id: new ObjectId(user_id),
        token: new_refresh_token,
        iat: decoded_refresh_token.iat,
        exp: decoded_refresh_token.exp
      })
    )

    return {
      access_token: new_access_token,
      refresh_token: new_refresh_token
    }
  }

  async verifyEmail(user_id: string) {
    const [token] = await Promise.all([
      this.signAccessTokenAndRefreshToken({ user_id, verify: UserVerifyStatus.Verified }),
      databaseService.users.updateOne(
        { _id: new ObjectId(user_id) },
        {
          $set: {
            email_verify_token: '',
            verify: UserVerifyStatus.Verified
            // updated_at: new Date()
          },
          $currentDate: {
            updated_at: true // MongoDB will set the current date for updated_at    // cách 1
          }
        }
      )
    ])

    const [access_token, refresh_token] = token

    const { iat, exp } = await this.decodeRefreshToken(refresh_token)

    await databaseService.refreshTokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id), token: refresh_token, iat, exp })
    )

    return {
      access_token,
      refresh_token
    }

    /*
    const result = await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          email_verify_token: '',
          updated_at: new Date()
        }
      }
    )
    return result
    */
  }

  async resendVerifyEmail(user_id: string) {
    const email_verify_token = await this.signEmailVerifyToken({ user_id, verify: UserVerifyStatus.Unverified })
    const result = await databaseService.users.updateOne({ _id: new ObjectId(user_id) }, [
      {
        $set: {
          email_verify_token,
          updated_at: '$$NOW' // cách 2: dùng '$$NOW' nhưng phải để trong mảng [ { } ]
        }
      }
    ])

    return result
  }

  async forgotPassword({ user_id, verify }: SignTokenPayload) {
    const forgot_password_token = await this.signForgotPasswordToken({ user_id, verify })
    const result = await databaseService.users.updateOne({ _id: new ObjectId(user_id) }, [
      {
        $set: {
          forgot_password_token,
          updated_at: '$$NOW'
        }
      }
    ])

    // Send email to user with forgot_password_token (reset password link): https://yourdomain.com/forgot-password?token=forgot_password_token
    console.log(`Send email to user with forgot password token: ${forgot_password_token}`)
    return result
  }

  async resetPassword(user_id: string, password: string) {
    const result = await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          password: hashPassword(password),
          forgot_password_token: ''
        },
        $currentDate: {
          updated_at: true // MongoDB will set the current date for updated_at
        }
      }
    )
    return result
  }

  async updateMe(user_id: string, payload: UpdateMeReqBody) {
    const updateData = payload.date_of_birth ? { ...payload, date_of_birth: new Date(payload.date_of_birth) } : payload
    const user = await databaseService.users.findOneAndUpdate(
      {
        _id: new ObjectId(user_id)
      },
      {
        $set: {
          ...(updateData as UpdateMeReqBody & { date_of_birth?: Date })
        },
        $currentDate: {
          updated_at: true // MongoDB will set the current date for updated_at
        }
      },
      {
        returnDocument: 'after',
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    )

    return user
  }

  async followUser(user_id: string, followed_user_id: string) {
    const follower = await databaseService.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })

    if (!follower) {
      const result = await databaseService.followers.insertOne(
        new Follower({
          user_id: new ObjectId(user_id),
          followed_user_id: new ObjectId(followed_user_id)
        })
      )

      if (!result.acknowledged || !result.insertedId) {
        return false
      }

      return true
    }

    return true
  }

  async unfollowUser(user_id: string, followed_user_id: string) {
    const follower = await databaseService.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })

    if (follower) {
      const result = await databaseService.followers.deleteOne(follower)

      if (!result.acknowledged || !result.deletedCount) {
        return false
      }

      return true
    }

    return true
  }

  async changePassword(user_id: string, password: string) {
    const result = await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          password: hashPassword(password)
        },
        $currentDate: {
          updated_at: true // MongoDB will set the current date for updated_at
        }
      }
    )
    return result
  }
}

const usersService = new UsersService()

export default usersService
