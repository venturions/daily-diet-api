import { randomUUID } from 'crypto'
import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { knex } from '../database'
import { CheckSessionIdExists } from '../middlewares/check-session-id-exists'

export async function usersRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [CheckSessionIdExists] }, async (request) => {
    const { sessionId } = request.cookies

    const users = await knex('users').where('session_id', sessionId).select('*')

    return { users }
  })

  app.post('/', async (request, response) => {
    const createUserBodySchema = z.object({
      name: z.string(),
      age: z.number(),
    })

    const { name, age } = createUserBodySchema.parse(request.body)

    let sessionId = request.cookies.sessionId

    if (!sessionId) {
      sessionId = randomUUID()

      response.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 Days
      })
    }

    await knex('users').insert({
      id: randomUUID(),
      name,
      age,
      session_id: sessionId,
    })

    return response.status(201).send()
  })
}
