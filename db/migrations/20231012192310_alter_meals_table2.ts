import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('meals', (table) => {
    table.renameColumn('DateAndHour', 'dateAndHour')
    table.dateTime('dateAndHour').alter()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('meals', (table) => {
    table.dropColumn('dateAndHour')
  })
}
