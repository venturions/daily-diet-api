import { randomUUID } from 'crypto'
import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { knex } from '../database'
import { CheckSessionIdExists } from '../middlewares/check-session-id-exists'

export async function mealsRoutes(app: FastifyInstance) {
  app.post(
    '/',
    { preHandler: [CheckSessionIdExists] },
    async (request, response) => {
      const sessionId = request.cookies.sessionId

      const getUserIdResponse = await knex('users')
        .select('id')
        .where('session_id', sessionId)
        .first()

      const userId = getUserIdResponse?.id

      const createMealBodySchema = z.object({
        name: z.string(),
        description: z.string(),
        inDiet: z.boolean(),
      })

      const { name, description, inDiet } = createMealBodySchema.parse(
        request.body,
      )

      await knex('meals').insert({
        id: randomUUID(),
        user_id: userId,
        name,
        description,
        dateAndHour: new Date(),
        inDiet,
      })

      return response.status(201).send()
    },
  )
}
