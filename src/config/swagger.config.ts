import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import path from "path";
import { Express } from "express";

const specPath = path.join(process.cwd(), "swagger.yaml");
const spec = YAML.load(specPath);

export const setupSwagger = (app: Express) => {
  // Swagger UI
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(spec));

  // Serve raw YAML
  app.get("/swagger.yaml", (req, res) => {
    res.sendFile(specPath);
  });

  // Serve JSON representation
  app.get("/openapi.json", (req, res) => {
    res.json(spec);
  });
};
