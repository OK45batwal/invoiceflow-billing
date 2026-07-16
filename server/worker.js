import { httpServer } from 'cloudflare:node';
import app from './server.js';

export default httpServer(app);
