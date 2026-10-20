# Route Lazy-Loading Performance

## What changed

`ProjectsPage` and `ContactPage` are now loaded with `React.lazy()` and rendered
inside `Suspense`. The initial task route does not request either page chunk.
The loading fallback displays a spinner and `Loading page...` while a route
chunk is requested.

## Before and after

Measurements were taken locally from the Vite production preview
(`http://127.0.0.1:4173`) using the browser Performance panel and the production
build output. Transfer sizes are the browser's `PerformanceResourceTiming`
`transferSize` values; build sizes are uncompressed file sizes.

| Measurement | Before lazy loading | After lazy loading |
| --- | ---: | ---: |
| Initial JavaScript build output | 194,537 B, one bundle | 197,247 B entry bundle |
| Initial route JavaScript transferred | 194,537 B | 61,716 B |
| Initial route navigation duration | Not separately recorded in the pre-change artifact | 54.1 ms |
| Projects route chunk | Included in the single bundle | 719 B build / 1,019 B transferred |
| Contact route chunk | Included in the single bundle | 509 B build |
| Initial request for Projects or Contact code | Immediate | Deferred until route navigation |

The entry bundle is slightly larger after adding the navigation and route
selection UI, but the initial browser transfer is substantially smaller because
the route-specific modules are not loaded on `/`. The route chunks are fetched
only when their links are selected. Browser timing varies with cache state and
machine load, so the values above are a local reproducible snapshot rather than
a performance guarantee.

## Reproduce the measurements

```powershell
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
```

In browser developer tools:

1. Open **Network**, enable **Disable cache**, and reload `/`.
2. Confirm the initial request list contains the entry JavaScript but not
   `ProjectsPage-*.js` or `ContactPage-*.js`.
3. Navigate to `/projects` and confirm `ProjectsPage-*.js` appears.
4. Navigate to `/contact` and confirm `ContactPage-*.js` appears.
5. Use the **Performance** panel or `performance.getEntriesByType('navigation')`
   and `performance.getEntriesByType('resource')` to record timing values.
