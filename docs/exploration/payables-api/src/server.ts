import { buildApp } from "./app.js";

const app = buildApp();
const port = Number(process.env.PORT ?? 3000);

// 0.0.0.0 is required inside a container (Fly) so the platform can reach it.
app
  .listen({ port, host: "0.0.0.0" })
  .then((addr) => app.log.info(`payables-api listening on ${addr}`))
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
