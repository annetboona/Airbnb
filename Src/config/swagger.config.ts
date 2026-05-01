import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import type { Express } from "express";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Rental API",
      version: "1.0.0",
      description: "API documentation for the rental platform",
    },
  },
  apis: [
    "./Src/docs/swagger.schema.ts",
    "./Src/routers/*.ts",
  ],
};

const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app: Express): void {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}