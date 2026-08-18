import { useEffect, useMemo, useState } from 'react'
import './App.css'

const emptyForm = {
  title: '',
  description: '',
}

function App() {
  const [tasks, setTasks] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [editingForm, setEditingForm] = useState(emptyForm)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const completedCount = useMemo(
    () => tasks.filter((task) => task.completed).length,
    [tasks],
  )

  async function request(path, options) {
    const response = await fetch(path, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    })

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}))
      throw new Error(payload.error || 'Request failed')
    }

    if (response.status === 204) {
      return null
    }

    return response.json()
  }

  useEffect(() => {
    let isCurrent = true

    request('/api/tasks')
      .then((data) => {
        if (isCurrent) {
          setTasks(data)
        }
      })
      .catch((err) => {
        if (isCurrent) {
          setError(err.message)
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false)
        }
      })

    return () => {
      isCurrent = false
    }
  }, [])

  function updateForm(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function updateEditingForm(event) {
    const { name, value } = event.target
    setEditingForm((current) => ({ ...current, [name]: value }))
  }

async function createTask(event) {
  event.preventDefault()

  if (!form.title.trim()) {
    setError('Task title is required')
    return
  }

  const confirmed = window.confirm(
    `Are you sure you want to create the task "${form.title}"?`
  )

  if (!confirmed) {
    return
  }

  try {
    setError('')
    setIsSaving(true)

    const task = await request('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(form),
    })

    setTasks((current) => [task, ...current])
    setForm(emptyForm)
  } catch (err) {
    setError(err.message)
  } finally {
    setIsSaving(false)
  }
}

  function startEdit(task) {
    setEditingId(task.id)
    setEditingForm({
      title: task.title,
      description: task.description,
    })
  }

  async function saveEdit(task) {
    if (!editingForm.title.trim()) {
      setError('Task title is required')
      return
    }

    try {
      setError('')
      const updatedTask = await request(`/api/tasks/${task.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...editingForm,
          completed: task.completed,
        }),
      })
      setTasks((current) =>
        current.map((item) => (item.id === task.id ? updatedTask : item)),
      )
      setEditingId(null)
    } catch (err) {
      setError(err.message)
    }
  }

  async function toggleStatus(task) {
  // If already completed, do nothing
  if (task.completed) {
    return
  }

  const confirmed = window.confirm(
    'Are you sure you want to mark this task as completed? This cannot be undone.'
  )

  if (!confirmed) {
    return
  }

  try {
    setError('')

    const updatedTask = await request(`/api/tasks/${task.id}`, {
      method: 'PUT',
      body: JSON.stringify({ completed: true }),
    })

    setTasks((current) =>
      current.map((item) =>
        item.id === task.id ? updatedTask : item
      )
    )
  } catch (err) {
    setError(err.message)
  }
}

async function deleteTask(taskId) {
  const confirmed = window.confirm(
    'Are you sure you want to delete this task?'
  )

  if (!confirmed) {
    return
  }

  try {
    setError('')
    await request(`/api/tasks/${taskId}`, {
      method: 'DELETE',
    })

    setTasks((current) =>
      current.filter((task) => task.id !== taskId)
    )
  } catch (err) {
    setError(err.message)
  }
}

  return (
    <main className="app-shell">
      <section className="panel create-panel" aria-labelledby="create-title">
        <h1 id="create-title">Create Task</h1>
        <form onSubmit={createTask}>
          <label htmlFor="title">Task Title *</label>
          <input
            id="title"
            name="title"
            type="text"
            placeholder="Task title..."
            value={form.title}
            onChange={updateForm}
          />

          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            placeholder="Task details..."
            value={form.description}
            onChange={updateForm}
            rows="6"
          />

          <button className="primary-button" type="submit" disabled={isSaving}>
            {isSaving ? 'Creating...' : '+ Create Task'}
          </button>
        </form>

        {error ? <p className="error-message">{error}</p> : null}
      </section>

      <section className="panel tasks-panel" aria-labelledby="tasks-title">
        <div className="tasks-heading">
          <h2 id="tasks-title">Tasks ({tasks.length})</h2>
          <span>
            {completedCount} done / {tasks.length - completedCount} pending
          </span>
        </div>

        {isLoading ? <p className="empty-state">Loading tasks...</p> : null}

        {!isLoading && tasks.length === 0 ? (
          <p className="empty-state">No tasks yet. Create your first one.</p>
        ) : null}

        <div className="task-list">
          {tasks.map((task) => {
            const isEditing = editingId === task.id

            return (
              <article className="task-card" key={task.id}>
                <span className="task-id">#{task.id}</span>

                {isEditing ? (
                  <div className="edit-form">
                    <input
                      aria-label="Edit task title"
                      name="title"
                      value={editingForm.title}
                      onChange={updateEditingForm}
                    />
                    <textarea
                      aria-label="Edit task description"
                      name="description"
                      value={editingForm.description}
                      onChange={updateEditingForm}
                      rows="4"
                    />
                  </div>
                ) : (
                  <>
                    <h3>{task.title}</h3>
                    <span
                      className={`status ${
                        task.completed ? 'completed' : 'pending'
                      }`}
                    >
                      {task.completed ? 'Completed' : 'Pending'}
                    </span>
                    <p>{task.description || 'No description provided.'}</p>
                  </>
                )}

                <div className="task-actions">
                  {isEditing ? (
                    <>
                      <button type="button" onClick={() => saveEdit(task)}>
                        Save
                      </button>
                      <button type="button" onClick={() => setEditingId(null)}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={() => startEdit(task)}>
                        Edit
                      </button>
                      <button type="button" onClick={() => toggleStatus(task)}>
                        {task.completed ? 'Mark Pending' : 'Mark Done'}
                      </button>
                      <button
                        className="danger-button"
                        type="button"
                        onClick={() => deleteTask(task.id)}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </main>
  )
}

export default App
