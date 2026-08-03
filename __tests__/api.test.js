const request = require('supertest');
const app = require('../app');

describe('Tasks API', () => {
    beforeEach(() => {
        if (app.resetTasks) app.resetTasks();
    });

    test('GET /api/tasks returns empty array', async () => {
        const res = await request(app).get('/api/tasks');
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(0);
    });

    test('POST /api/tasks creates task', async () => {
        const res = await request(app)
            .post('/api/tasks')
            .send({ title: 'Test', description: 'desc' });
        expect(res.statusCode).toBe(201);
        expect(res.body.id).toBeDefined();
        expect(res.body.title).toBe('Test');
    });

    test('GET /api/tasks/:id returns created task', async () => {
        const create = await request(app).post('/api/tasks').send({ title: 'X' });
        const id = create.body.id;
        const res = await request(app).get('/api/tasks/' + id);
        expect(res.statusCode).toBe(200);
        expect(res.body.id).toBe(id);
    });

    test('PUT /api/tasks/:id updates task', async () => {
        const create = await request(app).post('/api/tasks').send({ title: 'ToUpdate' });
        const id = create.body.id;
        const res = await request(app)
            .put('/api/tasks/' + id)
            .send({ status: 'completed', title: 'Updated' });
        expect(res.statusCode).toBe(200);
        expect(res.body.status).toBe('completed');
        expect(res.body.title).toBe('Updated');
    });

    test('DELETE /api/tasks/:id deletes', async () => {
        const create = await request(app).post('/api/tasks').send({ title: 'ToDelete' });
        const id = create.body.id;
        const res = await request(app).delete('/api/tasks/' + id);
        expect(res.statusCode).toBe(200);
        const get = await request(app).get('/api/tasks/' + id);
        expect(get.statusCode).toBe(404);
    });
});
