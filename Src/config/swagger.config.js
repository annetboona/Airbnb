import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
const options = {
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
export function setupSwagger(app) {
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
//# sourceMappingURL=swagger.config.js.map