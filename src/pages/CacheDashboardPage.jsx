import { useCallback, useEffect, useMemo, useState } from 'react'

const emptyStats = {
  hits: 0,
  misses: 0,
  hitRate: '0.0%',
  keys: 0,
  ttlSeconds: 60,
  invalidations: 0,
}

function CacheDashboardPage() {
  const [stats, setStats] = useState(emptyStats)
  const [lastRequest, setLastRequest] = useState(null)
  const [uncachedReadings, setUncachedReadings] = useState([])
  const [cachedReadings, setCachedReadings] = useState([])
  const [isRunning, setIsRunning] = useState(false)

  const loadStats = useCallback(async () => {
    const response = await fetch('/api/tasks/cache/stats')
    if (response.ok) {
      setStats(await response.json())
    }
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadStats().catch(() => {})
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [loadStats])

  async function testCache(bypassCache = false) {
    const startedAt = performance.now()
    const response = await fetch(
      `/api/tasks${bypassCache ? '?bypassCache=true' : ''}`,
    )
    const elapsed = Number((performance.now() - startedAt).toFixed(2))
    const cacheState = response.headers.get('X-Cache') || 'UNKNOWN'
    setLastRequest({ cacheState, elapsed })
    if (bypassCache) {
      setUncachedReadings((current) => [...current, elapsed].slice(-3))
    } else {
      setCachedReadings((current) => [...current, elapsed].slice(-3))
    }
    await loadStats()
  }

  async function runBenchmark() {
    setIsRunning(true)
    setUncachedReadings([])
    setCachedReadings([])
    for (let index = 0; index < 3; index += 1) {
      await testCache(true)
    }
    await testCache(false)
    for (let index = 1; index < 3; index += 1) {
      await testCache(false)
    }
    setIsRunning(false)
  }

  const average = (readings) =>
    readings.length
      ? `${(readings.reduce((sum, value) => sum + value, 0) / readings.length).toFixed(2)} ms`
      : '--'
  const speedup = useMemo(() => {
    const uncached = Number.parseFloat(average(uncachedReadings))
    const cached = Number.parseFloat(average(cachedReadings))
    return uncached && cached ? `${(uncached / cached).toFixed(1)}x` : '--'
  }, [uncachedReadings, cachedReadings])

  return (
    <main className="dashboard-page">
      <section className="cache-hero">
        <div className="dashboard-kicker">● PRACTICAL 9: IN-MEMORY CACHING (NODE-CACHE)</div>
        <div className="dashboard-title-row">
          <div>
            <h1>API Cache &amp; Query Optimization</h1>
            <p>Live measurements from the Task Management API</p>
          </div>
          <strong>TTL: {stats.ttlSeconds}s <span>RAM</span></strong>
        </div>

        <div className="stats-grid">
          <StatCard label="CACHE HITS" value={stats.hits} note="Served from memory" />
          <StatCard label="CACHE MISSES" value={stats.misses} note="Queried database" />
          <StatCard label="HIT RATIO" value={stats.hitRate} note="Efficiency rating" />
          <StatCard label="ACTIVE KEYS" value={stats.keys} note="Stored in node-cache" />
        </div>

        <div className={`cache-status ${lastRequest?.cacheState === 'HIT' ? 'hit' : ''}`}>
          <b>{lastRequest ? `CACHE ${lastRequest.cacheState}` : 'CACHE READY'}</b>
          <span>Source: node-cache (in-memory)</span>
          <span>Response Time: <b>{lastRequest ? `${lastRequest.elapsed} ms` : '--'}</b></span>
        </div>

        <div className="dashboard-actions">
          <button onClick={() => testCache(false)}>⚡ Test Cache (GET /tasks)</button>
          <button onClick={() => testCache(true)} className="purple">🔍 Test Uncached (Bypass)</button>
          <button onClick={loadStats} className="slate">▣ Refresh Stats</button>
          <button onClick={runBenchmark} className="orange" disabled={isRunning}>
            📊 {isRunning ? 'Running...' : 'Run 3× Benchmark Test'}
          </button>
        </div>

        <section className="benchmark-card">
          <div className="benchmark-heading">
            <h2>📈 Benchmark Results (3 Samples Each)</h2>
            <b>⚡ Cache is {speedup} faster</b>
          </div>
          <div className="benchmark-columns">
            <ReadingTable title="🔴 Uncached Reads (Database)" readings={uncachedReadings} />
            <ReadingTable title="🟢 Cached Reads (node-cache)" readings={cachedReadings} />
          </div>
        </section>
      </section>

      <section className="productivity-card">
        <p>ANALYTICS &amp; PERFORMANCE</p>
        <h2>Task Productivity Overview</h2>
        <div className="productivity-stats">
          <StatCard label="CACHE INVALIDATIONS" value={stats.invalidations} note="After writes" />
          <StatCard label="TOTAL REQUESTS" value={stats.totalRequests || 0} note="Observed by cache" />
        </div>
      </section>
    </main>
  )
}

function StatCard({ label, value, note }) {
  return <div className="stat-card"><small>{label}</small><strong>{value}</strong><span>{note}</span></div>
}

function ReadingTable({ title, readings }) {
  return (
    <div className="reading-table">
      <h3>{title}</h3>
      {[0, 1, 2].map((index) => (
        <div className="reading-row" key={index}>
          <span>Sample #{index + 1}</span>
          <b>{readings[index] ? `${readings[index]} ms` : '--'}</b>
        </div>
      ))}
      <div className="reading-row average-row"><strong>Average</strong><strong>{readings.length ? `${(readings.reduce((a, b) => a + b, 0) / readings.length).toFixed(2)} ms` : '--'}</strong></div>
    </div>
  )
}

export default CacheDashboardPage
