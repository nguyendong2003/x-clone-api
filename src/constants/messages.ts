export const UsersMessages = {
  VALIDATION_ERROR: 'Validation error',
  NAME_IS_REQUIRED: 'Name is required',
  NAME_MUST_BE_STRING: 'Name must be a string',
  NAME_LENGTH_INVALID: 'Name must be between 1 and 100 characters long',
  EMAIL_IS_REQUIRED: 'Email is required',
  EMAIL_INVALID: 'Invalid email address',
  EMAIL_ALREADY_EXISTS: 'Email is already exists',
  EMAIL_OR_PASSWORD_INCORRECT: 'Email or password is incorrect',
  PASSWORD_IS_REQUIRED: 'Password is required',
  PASSWORD_MUST_BE_STRING: 'Password must be a string',
  PASSWORD_LENGTH_INVALID: 'Password must be between 6 and 50 characters long',
  PASSWORD_NOT_STRONG_ENOUGH:
    'Password must be at least 6 characters long and include uppercase, lowercase, number, and symbol',
  CONFIRM_PASSWORD_IS_REQUIRED: 'Confirm password is required',
  CONFIRM_PASSWORD_MUST_BE_STRING: 'Confirm password must be a string',
  CONFIRM_PASSWORD_LENGTH_INVALID: 'Confirm password must be between 6 and 50 characters long',
  CONFIRM_PASSWORD_NOT_STRONG_ENOUGH:
    'Confirm password must be at least 6 characters long and include uppercase, lowercase, number, and symbol',
  CONFIRM_PASSWORD_NOT_MATCH: 'Confirm password does not match password',
  DATE_OF_BIRTH_INVALID: 'Date of birth must be a valid ISO8601 date string',
  LOGIN_SUCCESS: 'Login success',
  REGISTER_SUCCESS: 'Register success'
} as const
