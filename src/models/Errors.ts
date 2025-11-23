import { HttpStatus } from '~/constants/httpStatus'
import { UsersMessages } from '~/constants/messages'

type ErrorsType = Record<
  string,
  {
    msg: string
    [key: string]: any
  }
>

export class ErrorWithStatus {
  message: string
  status: number

  constructor({ message, status }: { message: string; status: number }) {
    this.message = message
    this.status = status
  }
}

export class EntityError extends ErrorWithStatus {
  errors: ErrorsType
  constructor({ message = UsersMessages.VALIDATION_ERROR, errors }: { message?: string; errors: ErrorsType }) {
    super({ message, status: HttpStatus.UNPROCESSABLE_ENTITY })
    this.errors = errors
  }
}
