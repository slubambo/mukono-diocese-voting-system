export type User = {
  id: number
  username: string
  email: string
  displayName?: string
  roles: string[]
  active: boolean
  createdAt?: string
  updatedAt?: string
}

export type CreateUserRequest = {
  username: string
  email: string
  password: string
  displayName?: string
  roles?: string[]
}

export type UpdateUserRequest = {
  email?: string
  displayName?: string
  roles?: string[]
  active?: boolean
}

export type PageUserResponse = {
  content: User[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

export type UsersListParams = {
  page?: number
  size?: number
  username?: string
  email?: string
  active?: boolean
}
