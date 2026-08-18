import 'dotenv/config'
import express from 'express'
import { MongoClient, ObjectId } from 'mongodb'

const app = express()
const PORT = process.env.PORT || 5000
const MONGODB_URI = process.env.MONGODB_URI
const DB_NAME = process.env.MONGODB_DB_NAME || 'taskmanager'
const TASKS_COLLECTION = 'tasks'

if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI. Add it to a .env file before starting.')
  process.exit(1)
}

const client = new MongoClient(MONGODB_URI)
let tasksCollection

function formatTask(task) {
  return {
    id: task._id.toString(),
    title: task.title,
    description: task.description || '',
    completed: Boolean(task.completed),
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  }
}

function getTaskObjectId(id) {
  return ObjectId.isValid(id) ? new ObjectId(id) : null
}

async function connectToDatabase() {
  await client.connect()

  const db = client.db(DB_NAME)
  tasksCollection = db.collection(TASKS_COLLECTION)
  await tasksCollection.createIndex({ createdAt: -1 })

  console.log(`Connected to MongoDB database "${DB_NAME}"`)
}

app.use(express.json())

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`)
  next()
})

app.get('/api/tasks', async (req, res, next) => {
  try {
    const tasks = await tasksCollection
      .find()
      .sort({ createdAt: -1 })
      .toArray()

    res.status(200).json(tasks.map(formatTask))
  } catch (err) {
    next(err)
  }
})

app.get('/api/tasks/:id', async (req, res, next) => {
  try {
    const _id = getTaskObjectId(req.params.id)

    if (!_id) {
      return res.status(404).json({ error: 'Task not found' })
    }

    const task = await tasksCollection.findOne({ _id })

    if (!task) {
      return res.status(404).json({ error: 'Task not found' })
    }

    res.status(200).json(formatTask(task))
  } catch (err) {
    next(err)
  }
})

app.post('/api/tasks', async (req, res, next) => {
  try {
    const { title, description = '' } = req.body

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Task title is required' })
    }

    const now = new Date()
    const task = {
      title: title.trim(),
      description:
        typeof description === 'string' ? description.trim() : '',
      completed: false,
      createdAt: now,
      updatedAt: now,
    }

    const result = await tasksCollection.insertOne(task)

    res.status(201).json(formatTask({ _id: result.insertedId, ...task }))
  } catch (err) {
    next(err)
  }
})

app.put('/api/tasks/:id', async (req, res, next) => {
  try {
    const _id = getTaskObjectId(req.params.id)

    if (!_id) {
      return res.status(404).json({ error: 'Task not found' })
    }

    const updates = {
      updatedAt: new Date(),
    }

    if (typeof req.body.title === 'string' && req.body.title.trim()) {
      updates.title = req.body.title.trim()
    }

    if (typeof req.body.description === 'string') {
      updates.description = req.body.description.trim()
    }

    if (typeof req.body.completed === 'boolean') {
      updates.completed = req.body.completed
    }

    const result = await tasksCollection.findOneAndUpdate(
      { _id },
      { $set: updates },
      { returnDocument: 'after' },
    )

    if (!result) {
      return res.status(404).json({ error: 'Task not found' })
    }

    res.status(200).json(formatTask(result))
  } catch (err) {
    next(err)
  }
})

app.delete('/api/tasks/:id', async (req, res, next) => {
  try {
    const _id = getTaskObjectId(req.params.id)

    if (!_id) {
      return res.status(404).json({ error: 'Task not found' })
    }

    const result = await tasksCollection.deleteOne({ _id })

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Task not found' })
    }

    res.status(200).json({ message: 'Task deleted successfully' })
  } catch (err) {
    next(err)
  }
})

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

app.use((err, req, res, next) => {
  void next
  console.error(err.stack)
  res.status(500).json({ error: 'Something went wrong' })
})

connectToDatabase()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err)
    process.exit(1)
  })