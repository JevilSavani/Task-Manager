# Task API Caching

## Configuration

The API uses `node-cache` with a default TTL of 60 seconds. The TTL can be
changed for an experiment without editing code:

```env
CACHE_TTL_SECONDS=30
```

Cached endpoints:

- `GET /api/tasks` uses the `tasks:all` key.
- `GET /api/tasks/:id` uses a separate `tasks:<id>` key.
- `GET /api/cache/stats` reports cache hits, misses, active keys, and TTL.
- `/cache-dashboard` provides a submission-ready visual benchmark dashboard with
  cache cards, live response status, and three-sample comparisons.

Successful `POST`, `PUT`, and `DELETE` operations invalidate the all-task cache
and the affected single-task cache. Failed writes do not invalidate caches.

## Measurements

Record the `Time` value shown by Postman or Thunder Client for three requests
after restarting the API. The first request is a cache miss; subsequent
requests should be cache hits while the TTL is active. The following local
sample was recorded against the running API on 2026-10-20 using the same HTTP
request pattern (PowerShell's HTTP client was used because Postman was not
available in this workspace):

| Request | Cache state | Reading 1 | Reading 2 | Reading 3 | Average |
| --- | --- | ---: | ---: | ---: | ---: |
| `GET /api/tasks` | Uncached / miss | 161.82 ms | 154.65 ms | 132.34 ms | 149.60 ms |
| `GET /api/tasks` | Cached / hit | 16.87 ms | 15.79 ms | 19.41 ms | 17.36 ms |

For the all-task readings, each uncached request followed a successful
temporary create/delete cycle, which invalidated the list cache. The cached
readings followed one warm-up request. The cached sample averaged about 88%
faster than the uncached sample. Use the Postman **Time** field to repeat the
same measurement in the lab journal. The single-task endpoint uses the same
hit/miss behavior with its own key and can be measured by repeating the
process with `GET /api/tasks/:id`.

To compare against an uncached request, use a fresh process or temporarily
disable the cache lookup and `taskCache.set` calls in a local experiment. Do
not leave caching disabled in the submitted implementation. Confirm the
request type with `/api/cache/stats`; a repeated GET should increase `hits`,
while a cache miss should increase `misses`.

## Analysis

### Why invalidate on every write?

The all-task response and the affected single-task response both contain
database state. A successful create, update, or delete changes that state, so
both cached representations must be removed before another read. Without
invalidation, clients could receive deleted tasks, old titles, stale completion
states, or a list that omits a newly created task until the TTL expires.

### Choosing a TTL

Sixty seconds is a reasonable starting point for a task manager: reads can be
served quickly during normal navigation while changes become visible within a
short interval even if an invalidation path is missed. A shorter TTL reduces
staleness but causes more database reads. A longer TTL improves cache hit rate
and reduces database load but increases the maximum time stale data can be
served.

### Why this is not for multiple API instances

`node-cache` stores entries inside one Node.js process. With multiple server
instances, each instance has a different cache, so a write handled by one
instance cannot invalidate entries held by another. Requests can therefore
return inconsistent results depending on load balancing. A shared Redis or
Memcached cache, with coordinated invalidation, is appropriate for a
multi-instance deployment.

### TTL experiment

Try `CACHE_TTL_SECONDS=5`, `60`, and `300`, repeating the four request groups
above. A 5-second TTL should show more misses during a longer test and less
perceived staleness; 300 seconds should show more hits but can keep unchanged
data in memory and allow stale responses for longer if invalidation is
incorrect or bypassed.
