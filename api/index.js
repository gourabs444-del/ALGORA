import { buildApp } from '../src/app.js';

const app = buildApp();

export default async function handler(req, res) {
  await app.ready();
  app.server.emit('request', req, res);
}
