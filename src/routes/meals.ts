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
        dateAndHour: z.string().transform((value) => new Date(value)),
        inDiet: z.boolean(),
      })

      const { name, description, inDiet, dateAndHour } =
        createMealBodySchema.parse(request.body)

      await knex('meals').insert({
        id: randomUUID(),
        user_id: userId,
        name,
        description,
        dateAndHour,
        inDiet,
      })

      return response.status(201).send()
    },
  )

  app.put(
    '/:id',
    { preHandler: [CheckSessionIdExists] },
    async (request, response) => {
      const getMealsParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = getMealsParamsSchema.parse(request.params)

      const editMealBodySchema = z.object({
        name: z.string(),
        description: z.string(),
        dateAndHour: z.string().transform((value) => new Date(value)),
        inDiet: z.boolean(),
      })

      const { name, description, inDiet, dateAndHour } =
        editMealBodySchema.parse(request.body)

      await knex('meals').where('id', id).update({
        name,
        description,
        dateAndHour,
        inDiet,
      })

      return response.status(201).send()
    },
  )
}
