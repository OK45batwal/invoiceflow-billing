import { onRequest } from "firebase-functions/v2/https";
import { app } from "./server/index.js";

// Export the Express app as a Firebase HTTP Cloud Function
export const api = onRequest(app);
