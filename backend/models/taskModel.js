const data = require('../data/tasks');

function getAll() {
    return data.tasks;
}

function getById(id) {
    return data.tasks.find(t => t.id === id);
}

function create({ title, description, status }) {
    const task = {
        id: data.nextId++,
        title,
        description: description || '',
        status: status || 'pending',
        createdAt: new Date().toISOString()
    };
    data.tasks.push(task);
    return task;
}

function update(id, fields) {
    const idx = data.tasks.findIndex(t => t.id === id);
    if (idx === -1) return null;
    const existing = data.tasks[idx];
    const updated = Object.assign(existing, {
        title: fields.title !== undefined ? fields.title : existing.title,
        description: fields.description !== undefined ? fields.description : existing.description,
        status: fields.status !== undefined ? fields.status : existing.status,
        updatedAt: new Date().toISOString()
    });
    data.tasks[idx] = updated;
    return updated;
}

function remove(id) {
    const idx = data.tasks.findIndex(t => t.id === id);
    if (idx === -1) return null;
    return data.tasks.splice(idx, 1)[0];
}

function reset() {
    data.tasks.length = 0;
    data.nextId = 1;
}

module.exports = { getAll, getById, create, update, remove, reset };
