const model = require('../models/taskModel');

function getAll(req, res) {
    res.json(model.getAll());
}

function getById(req, res) {
    const id = parseInt(req.params.id, 10);
    const task = model.getById(id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
}

function create(req, res) {
    const { title, description, status } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });
    const task = model.create({ title, description, status });
    res.status(201).json(task);
}

function update(req, res) {
    const id = parseInt(req.params.id, 10);
    const existing = model.getById(id);
    if (!existing) return res.status(404).json({ error: 'Task not found' });
    const updated = model.update(id, req.body);
    res.json(updated);
}

function remove(req, res) {
    const id = parseInt(req.params.id, 10);
    const removed = model.remove(id);
    if (!removed) return res.status(404).json({ error: 'Task not found' });
    res.json(removed);
}

module.exports = { getAll, getById, create, update, remove };
