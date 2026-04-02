import "./loadEnv.js";
import { app } from "../server/index.js";

const port = process.env.PORT || 3000;
const host = process.env.HOST || '0.0.0.0';

app.listen(port, host, () => {
  console.log(`InvoiceFlow Pro listening on http://${host}:${port} (Local development server)`);
});
