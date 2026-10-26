import assert from 'node:assert/strict'
import test from 'node:test'
import {
  ALL_TASKS_CACHE_KEY,
  cacheStats,
  getTaskCacheKey,
  invalidateTaskCaches,
  taskCache,
} from '../cache.js'

test('builds a task-specific cache key', () => {
  assert.equal(getTaskCacheKey('task-123'), 'tasks:task-123')
})

test('invalidates the task list and task-specific cache entries', () => {
  const taskId = 'task-test'
  taskCache.set(ALL_TASKS_CACHE_KEY, [{ id: taskId }])
  taskCache.set(getTaskCacheKey(taskId), { id: taskId })
  const invalidationsBefore = cacheStats.invalidations

  invalidateTaskCaches(taskId)

  assert.equal(taskCache.has(ALL_TASKS_CACHE_KEY), false)
  assert.equal(taskCache.has(getTaskCacheKey(taskId)), false)
  assert.equal(cacheStats.invalidations, invalidationsBefore + 1)
})
