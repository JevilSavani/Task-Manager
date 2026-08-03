const apiBase = '/api/tasks';

async function fetchTasks() {
    const res = await fetch(apiBase);
    return res.json();
}

function badgeFor(status) {
    if (status === 'completed') return `<span class="badge completed">COMPLETED</span>`;
    return `<span class="badge pending">PENDING</span>`;
}

function renderTask(task) {
    const el = document.createElement('div');
    el.className = 'task-card';
    const date = task.createdAt ? new Date(task.createdAt).toLocaleString() : '';
    el.innerHTML = `
      <div class="task-header">
        <div>
          <div class="task-id">#${task.id}</div>
          <div class="task-title">${task.title}</div>
        </div>
        <div>${badgeFor(task.status)}</div>
      </div>
      <div class="meta">${task.description || ''}</div>
      <div class="task-actions">
        <button data-id="${task.id}" class="btn-edit">Edit</button>
        <button data-id="${task.id}" class="btn-toggle">${task.status === 'completed' ? 'Mark Pending' : 'Mark Done'}</button>
        <button data-id="${task.id}" class="btn-delete">Delete</button>
      </div>
      <div class="meta">Created: ${date}</div>
    `;
    return el;
}

let allTasks = [];
let activeFilter = 'all';

async function load() {
    allTasks = await fetchTasks();
    renderList();
}

function renderList() {
    const container = document.getElementById('tasks');
    container.innerHTML = '';
    const search = (document.getElementById('search')?.value || '').toLowerCase();
    let filtered = allTasks.filter(t => {
        if (activeFilter === 'pending') return t.status !== 'completed';
        if (activeFilter === 'completed') return t.status === 'completed';
        return true;
    }).filter(t => t.title.toLowerCase().includes(search) || (t.description || '').toLowerCase().includes(search));
    document.getElementById('count').textContent = filtered.length;
    filtered.forEach(t => container.appendChild(renderTask(t)));
}

document.getElementById('create').addEventListener('click', async () => {
    const title = document.getElementById('title').value.trim();
    const description = document.getElementById('description').value.trim();
    if (!title) return alert('Title required');
    await fetch(apiBase, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, description }) });
    document.getElementById('title').value = '';
    document.getElementById('description').value = '';
    load();
});

document.getElementById('clear').addEventListener('click', () => {
    document.getElementById('title').value = '';
    document.getElementById('description').value = '';
});

document.getElementById('search').addEventListener('input', () => renderList());

document.querySelectorAll('.filter').forEach(btn => btn.addEventListener('click', (e) => {
    document.querySelectorAll('.filter').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    activeFilter = e.target.dataset.filter;
    renderList();
}));

// modal logic
let editingId = null;
const modal = document.getElementById('modal');
const editTitle = document.getElementById('edit-title');
const editDescription = document.getElementById('edit-description');
const editStatus = document.getElementById('edit-status');

function openEdit(task) {
    editingId = task.id;
    editTitle.value = task.title || '';
    editDescription.value = task.description || '';
    editStatus.value = task.status || 'pending';
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
}

function closeEdit() {
    editingId = null;
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
}

document.getElementById('save-edit').addEventListener('click', async () => {
    if (!editingId) return closeEdit();
    await fetch(apiBase + '/' + editingId, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: editTitle.value, description: editDescription.value, status: editStatus.value }) });
    closeEdit();
    load();
});

document.getElementById('cancel-edit').addEventListener('click', () => closeEdit());

// delegate actions
document.getElementById('tasks').addEventListener('click', async (e) => {
    const id = e.target.dataset.id;
    if (!id) return;
    if (e.target.classList.contains('btn-delete')) {
        await fetch(apiBase + '/' + id, { method: 'DELETE' });
        load();
    } else if (e.target.classList.contains('btn-toggle')) {
        const res = await fetch(apiBase + '/' + id);
        const task = await res.json();
        const newStatus = task.status === 'completed' ? 'pending' : 'completed';
        await fetch(apiBase + '/' + id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) });
        load();
    } else if (e.target.classList.contains('btn-edit')) {
        const res = await fetch(apiBase + '/' + id);
        const task = await res.json();
        openEdit(task);
    }
});

load();
