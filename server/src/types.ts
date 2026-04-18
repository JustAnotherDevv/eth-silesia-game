import '@fastify/jwt'

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { userId: string; email: string }
    user:    { userId: string; email: string }
  }
}

export interface SignupBody {
  name: string
  username: string
  email: string
  password: string
  avatarEmoji?: string
  goals?: string[]
  orgId?: string
  newCommunity?: {
    name: string
    emoji: string
    type: string
    isPublic: boolean
    code: string
  }
}

export interface LoginBody {
  email: string
  password: string
}
