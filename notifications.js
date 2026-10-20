import { EventEmitter } from 'node:events'

export const taskEvents = new EventEmitter()

taskEvents.on('task-created', ({ title, createdAt, assignedUser }) => {
  const handlerTimestamp = new Date().toISOString()

  console.log(
    `[notification] task-created handler executed at ${handlerTimestamp}: ` +
      `Task "${title}" created at ${createdAt.toISOString()} and assigned to ${assignedUser}`,
  )
})
