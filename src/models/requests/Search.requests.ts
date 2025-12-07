import { MediaTypeQuery, PeopleFollowQuery } from '~/constants/enums'
import { PaginationQuery } from '~/models/requests/Tweet.requests'

export interface SearchQuery extends PaginationQuery {
  content: string
  media_type?: MediaTypeQuery
  people_follow?: PeopleFollowQuery
}
