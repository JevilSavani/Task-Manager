# Richardson Maturity Model Evaluation

Project: Task Manager API (Practical 4)

1) Summary of API
- HTTP endpoints under `/api/tasks` implementing CRUD over tasks using JSON.

2) Richardson Maturity Model (RMM) assessment
- Level 0 (Swamp of POX): Uses single URL or RPC-style endpoints without HTTP verbs. NOT APPLICABLE — our API uses multiple resource-oriented endpoints.
- Level 1 (Resources): Uses resource URIs (e.g., `/api/tasks`, `/api/tasks/:id`) but may not use proper HTTP verbs. PARTIALLY SATISFIED — our API exposes resource URIs and uses HTTP verbs correctly.
- Level 2 (HTTP Verbs): Uses correct HTTP verbs and status codes and content negotiation where appropriate. SATISFIED — `GET`, `POST`, `PUT`, and `DELETE` are used; status codes 200/201/404/400 returned.
- Level 3 (HATEOAS): Responses include hypermedia links to drive state transitions. NOT SATISFIED — responses are simple JSON representations without hypermedia (no `_links` or related controls).

Conclusion: The API satisfies RMM Level 2.

3) Improvements to reach Level 2 (if needed)
- The API already satisfies Level 2: resource URIs + proper HTTP verbs + status codes.

4) Steps and notes for Level 3 (optional)
- To reach Level 3, add hypermedia links in responses. Example response for a task:

```
{
  "id": 1,
  "title": "Learn Node.js",
  "status": "pending",
  "_links": {
    "self": { "href": "/api/tasks/1" },
    "complete": { "href": "/api/tasks/1", "method": "PUT", "body": { "status": "completed" } },
    "delete": { "href": "/api/tasks/1", "method": "DELETE" }
  }
}
```

Implementing HATEOAS would involve updating route handlers to include `_links`, and possibly adding accept-content negotiation to serve different representations.

5) References
- Leonard Richardson — The Richardson Maturity Model
- Roy Fielding — REST architectural style

Author: Practical 4 submission
