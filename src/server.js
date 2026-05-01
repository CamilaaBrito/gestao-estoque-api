const app = require("./app");

const port = process.env.PORT || 3000;
const host = process.env.HOST || "localhost";

app.listen(port, () => {
  console.log("API de gestao de estoque em execução.");
  console.log("");
  console.log(`Swagger UI: http://${host}:${port}/docs-api`);
});
