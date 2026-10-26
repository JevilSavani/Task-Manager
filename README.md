<<<<<<< HEAD
# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
=======
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
>>>>>>> 5f91b96a8ea14e07cd95dfebcf774faef04e027e

## AI task descriptions

The create-task form can generate a concise description from a task title using
the OpenAI API. Configure `OPENAI_API_KEY` in the backend `.env` file (never in
frontend code). `OPENAI_MODEL` is optional and defaults to `gpt-4o-mini`.

If the AI service is unavailable or times out, the form displays an error and
tasks can still be created with a manually entered description.
