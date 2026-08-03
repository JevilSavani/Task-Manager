# Task Manager API

Simple Node + Express API with a static frontend for managing tasks (in-memory storage).

Run:

```bash
cd "task-manager-api"
npm install
npm start
```

API endpoints:
- `GET /api/tasks` - list tasks
- `GET /api/tasks/:id` - get task
- `POST /api/tasks` - create task { title, description }
- `PUT /api/tasks/:id` - update task fields
- `DELETE /api/tasks/:id` - delete task

Open http://localhost:5000 in your browser to use the simple frontend.
