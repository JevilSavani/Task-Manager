import 'dotenv/config'
import express from 'express'
import { MongoClient, ObjectId } from 'mongodb'
import { taskEvents } from './notifications.js'
import {
  ALL_TASKS_CACHE_KEY,
  cacheStats,
  getTaskCacheKey,
  invalidateTaskCaches,
  taskCache,
} from './cache.js'

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
    assignedUser: task.assignedUser || 'Unassigned',
    completed: Boolean(task.completed),
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  }
}

function getTaskObjectId(id) {
  return ObjectId.isValid(id) ? new ObjectId(id) : null
}

function setCacheHeaders(res, cacheState, cacheKey, startedAt) {
  const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000
  res.set({
    'X-Cache': cacheState,
    'X-Cache-Key': cacheKey,
    'X-Response-Time': `${elapsedMs.toFixed(2)}ms`,
  })
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
    const startedAt = process.hrtime.bigint()
    const bypassCache = req.query.bypassCache === 'true'
    const cacheKey = ALL_TASKS_CACHE_KEY
    const cachedTasks = bypassCache ? undefined : taskCache.get(cacheKey)

    if (cachedTasks !== undefined) {
      cacheStats.hits += 1
      setCacheHeaders(res, 'HIT', cacheKey, startedAt)
      return res.status(200).json(cachedTasks)
    }

    cacheStats.misses += 1
    const tasks = await tasksCollection
      .find()
      .sort({ createdAt: -1 })
      .toArray()

    const formattedTasks = tasks.map(formatTask)
    if (!bypassCache) {
      taskCache.set(cacheKey, formattedTasks)
    }

    setCacheHeaders(res, bypassCache ? 'BYPASS' : 'MISS', cacheKey, startedAt)
    res.status(200).json(formattedTasks)
  } catch (err) {
    next(err)
  }
})

app.get('/api/tasks/:id', async (req, res, next) => {
  try {
    const startedAt = process.hrtime.bigint()
    const _id = getTaskObjectId(req.params.id)

    if (!_id) {
      return res.status(404).json({ error: 'Task not found' })
    }

    const taskCacheKey = getTaskCacheKey(req.params.id)
    const bypassCache = req.query.bypassCache === 'true'
    const cachedTask = bypassCache ? undefined : taskCache.get(taskCacheKey)

    if (cachedTask !== undefined) {
      cacheStats.hits += 1
      setCacheHeaders(res, 'HIT', taskCacheKey, startedAt)
      return res.status(200).json(cachedTask)
    }

    cacheStats.misses += 1
    const task = await tasksCollection.findOne({ _id })

    if (!task) {
      return res.status(404).json({ error: 'Task not found' })
    }

    const formattedTask = formatTask(task)
    if (!bypassCache) {
      taskCache.set(taskCacheKey, formattedTask)
    }

    setCacheHeaders(res, bypassCache ? 'BYPASS' : 'MISS', taskCacheKey, startedAt)
    res.status(200).json(formattedTask)
  } catch (err) {
    next(err)
  }
})

function getCacheStats() {
  return {
    success: true,
    message: 'node-cache in-memory caching statistics',
    hits: cacheStats.hits,
    misses: cacheStats.misses,
    totalRequests: cacheStats.hits + cacheStats.misses,
    hitRate:
      cacheStats.hits + cacheStats.misses > 0
        ? `${((cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100).toFixed(1)}%`
        : '0.0%',
    invalidations: cacheStats.invalidations,
    keys: taskCache.keys().length,
    ttlSeconds: taskCache.options.stdTTL,
    activeKeysCount: taskCache.keys().length,
    activeKeys: taskCache.keys(),
  }
}

app.get(['/api/cache/stats', '/api/tasks/cache/stats'], (req, res) => {
  res.status(200).json(getCacheStats())
})

app.post('/api/tasks', async (req, res, next) => {
  try {
    const { title, description = '', assignedUser = '' } = req.body

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Task title is required' })
    }

    const now = new Date()
    const task = {
      title: title.trim(),
      description:
        typeof description === 'string' ? description.trim() : '',
      assignedUser:
        typeof assignedUser === 'string' && assignedUser.trim()
          ? assignedUser.trim()
          : 'Unassigned',
      completed: false,
      createdAt: now,
      updatedAt: now,
    }

    const result = await tasksCollection.insertOne(task)
    invalidateTaskCaches(result.insertedId.toString())

    const responseTask = formatTask({ _id: result.insertedId, ...task })
    res.status(201).json(responseTask)
    console.log(`[api] task response sent at ${new Date().toISOString()}`)

    setImmediate(() => {
      taskEvents.emit('task-created', {
        title: task.title,
        createdAt: task.createdAt,
        assignedUser: task.assignedUser,
      })
    })
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

    if (typeof req.body.assignedUser === 'string') {
      updates.assignedUser = req.body.assignedUser.trim() || 'Unassigned'
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

    invalidateTaskCaches(req.params.id)
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

    invalidateTaskCaches(req.params.id)
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