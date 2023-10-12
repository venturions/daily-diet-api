import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('meals', (table) => {
    table.uuid('id').primary()
    table.integer('user_id').unsigned().references('users.id')
    table.text('name').notNullable()
    table.decimal('description').notNullable()
    table.timestamp('DateAndHour').notNullable()
    table.boolean('inDiet').notNullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('meals')
}
