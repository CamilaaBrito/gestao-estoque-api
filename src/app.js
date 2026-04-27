const express = require("express");
const path = require("path");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");

const apiRoutes = require("./routes");

const app = express();
const swaggerDocument = YAML.load(path.resolve(__dirname, "../docs/API-gestao-estoque.yaml"));

app.use(express.json());

app.get("/health", (_request, response) => {
  response.json({
    status: "ok",
    timestamp: new Date().toISOString()
  });
});

app.use("/docs-api", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(apiRoutes);

app.use((error, _request, response, _next) => {
  const status = error.status || 500;

  response.status(status).json({
    code: error.code || "INTERNAL_SERVER_ERROR",
    message: error.message || "Erro interno do servidor.",
    details: error.details || null
  });
});

module.exports = app;
