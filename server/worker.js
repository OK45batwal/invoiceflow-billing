import { httpServerHandler } from 'cloudflare:node';
import app from './server.js';

const PORT = 5001;

// Start listening internally so the Express router handles requests
app.listen(PORT);

// Export the Worker handler mapped to the Express instance port
export default httpServerHandler({ port: PORT });
