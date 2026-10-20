import NodeCache from 'node-cache'

const cacheTtlSeconds = Number.parseInt(
  process.env.CACHE_TTL_SECONDS || '60',
  10,
)

export const taskCache = new NodeCache({
  stdTTL: Number.isFinite(cacheTtlSeconds) && cacheTtlSeconds > 0
    ? cacheTtlSeconds
    : 60,
  checkperiod: 0,
})

export const cacheStats = {
  hits: 0,
  misses: 0,
  invalidations: 0,
}

export const ALL_TASKS_CACHE_KEY = 'tasks:all'

export function getTaskCacheKey(taskId) {
  return `tasks:${taskId}`
}

export function invalidateTaskCaches(taskId) {
  taskCache.del(ALL_TASKS_CACHE_KEY)
  cacheStats.invalidations += 1

  if (taskId) {
    taskCache.del(getTaskCacheKey(taskId))
  }
}
