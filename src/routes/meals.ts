import { randomUUID } from 'crypto'
import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { knex } from '../database'
import { CheckSessionIdExists } from '../middlewares/check-session-id-exists'

export async function mealsRoutes(app: FastifyInstance) {
  app.get(
    '/:id',
    { preHandler: [CheckSessionIdExists] },
    async (request, response) => {
      const sessionId = request.cookies.sessionId

      const getMealsParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = getMealsParamsSchema.parse(request.params)

      const meal = await knex('meals').where('id', id).select('*').first()

      if (meal !== undefined) {
        const getUserIdResponse = await knex('users')
          .select('id')
          .where('session_id', sessionId)
          .first()

        const userId = getUserIdResponse?.id

        if (userId !== meal.user_id) {
          return response.status(401).send({
            result: 'error',
            message:
              'Você não tem permissão para ver refeições de outro usuário',
          })
        }
      }

      return meal
    },
  )

  app.get(
    '/user',
    { preHandler: [CheckSessionIdExists] },
    async (request, response) => {
      const sessionId = request.cookies.sessionId

      const meals = await knex('meals')
        .select(
          'meals.id',
          'meals.user_id',
          'meals.name',
          'meals.description',
          'meals.dateAndHour',
          'meals.inDiet',
        )
        .innerJoin('users', 'users.id', 'meals.user_id')
        .where('session_id', sessionId)

      if (meals.length === 0) {
        return response.status(404).send({
          result: 'error',
          message: 'Você não tem nenhuma refeição cadastrada',
        })
      }

      return meals
    },
  )

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
      const sessionId = request.cookies.sessionId

      const getMealsParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = getMealsParamsSchema.parse(request.params)

      const meal = await knex('meals').select('*').where('id', id).first()

      const getUserIdResponse = await knex('users')
        .select('id')
        .where('session_id', sessionId)
        .first()

      const userId = getUserIdResponse?.id

      if (userId !== meal.user_id) {
        return response.status(401).send({
          result: 'error',
          message:
            'Você não tem permissão para alterar refeições de outro usuário',
        })
      }

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

  app.delete(
    '/:id',
    { preHandler: [CheckSessionIdExists] },
    async (request, response) => {
      const sessionId = request.cookies.sessionId

      const getMealsParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = getMealsParamsSchema.parse(request.params)

      const meal = await knex('meals').select('*').where('id', id).first()

      const getUserIdResponse = await knex('users')
        .select('id')
        .where('session_id', sessionId)
        .first()

      const userId = getUserIdResponse?.id

      if (userId !== meal.user_id) {
        return response.status(401).send({
          result: 'error',
          message:
            'Você não tem permissão para alterar refeições de outro usuário',
        })
      }

      await knex('meals').where('id', id).delete()

      return response.send()
    },
  )
}
