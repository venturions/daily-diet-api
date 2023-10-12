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

  app.get(
    '/metrics',
    { preHandler: [CheckSessionIdExists] },
    async (request, response) => {
      const { sessionId } = request.cookies

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
          message:
            'Você não tem nenhuma refeição cadastrada para obter métricas.',
        })
      }

      const totalNumberOfMeals = meals.length
      const totalNumberOfMealsInTheDiet = meals.filter(
        (item) => item.inDiet === 1,
      ).length
      const totalNumberOfMealsOffTheDiet = meals.filter(
        (item) => item.inDiet === 0,
      ).length

      let currentStreak = 0
      let maxStreak = 0

      for (const meal of meals) {
        if (meal.inDiet === 1) {
          currentStreak++
        } else {
          if (currentStreak > maxStreak) {
            maxStreak = currentStreak
          }
          currentStreak = 0
        }
      }

      if (currentStreak > maxStreak) {
        maxStreak = currentStreak
      }

      const metricsResponse = {
        totalNumberOfMeals,
        totalNumberOfMealsInTheDiet,
        totalNumberOfMealsOffTheDiet,
        bestSequenceOfMealsWithinTheDiet: maxStreak,
      }

      return metricsResponse
    },
  )

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
