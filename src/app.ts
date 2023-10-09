import fastify from 'fastify'
import fastifyCookie from '@fastify/cookie'
import { usersRoutes } from './routes/users'

export const app = fastify()

app.register(fastifyCookie)
app.register(usersRoutes, {
  prefix: 'users',
})
