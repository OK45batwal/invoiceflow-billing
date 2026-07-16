import { httpServerHandler } from 'cloudflare:node';
import app from './server.js';

app.listen(5001);
export default httpServerHandler({ port: 5001 });
