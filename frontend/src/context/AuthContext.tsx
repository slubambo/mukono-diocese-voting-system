import React, { createContext, useContext, useState } from 'react'

type Role =
  | 'ROLE_ADMIN'
  | 'ROLE_DS'
  | 'ROLE_BISHOP'
  | 'ROLE_SENIOR_STAFF'
  | 'ROLE_POLLING_OFFICER'
  | 'ROLE_VOTER'

type UserInfo = {
  username: string
  roles: Role[]
} | null

type AuthContextType = {
  user: UserInfo
  token: string | null
  login: (token: string, user: UserInfo) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserInfo>(() => {
    const storedUser = localStorage.getItem('mdvs_user')
    return storedUser ? (JSON.parse(storedUser) as UserInfo) : null
  })
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('mdvs_token'))

  const login = (newToken: string, newUser: UserInfo) => {
    setToken(newToken)
    setUser(newUser)
    localStorage.setItem('mdvs_token', newToken)
    localStorage.setItem('mdvs_user', JSON.stringify(newUser))
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('mdvs_token')
    localStorage.removeItem('mdvs_user')
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
