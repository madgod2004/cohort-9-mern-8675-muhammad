import { expect } from 'chai';
import request from 'supertest';
import app from '../src/app';

describe('404 handling', () => {
  it('returns 404 no such route', async () => {
    const res = await request(app).get('/imaginary-route');
    expect(res.status).to.equal(404);
    expect(res.body.error.message).to.include('/imaginary-route');
  });

  it('res.body.error exists', async () => {
    const res = await request(app).get('/imaginary-route');
    expect(res.body.error).to.exist;
  });
});
