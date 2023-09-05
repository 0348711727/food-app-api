import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

// Swagger options
const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "FOOD APP API",
      version: "1.0.0",
      description: "API documentation",
    },
    components: {
      securitySchemas: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ["../routes/*.js"], // Path to the API routes folder or specific route files
};

// Initialize swagger-jsdoc
const swaggerDocs = swaggerJsDoc(swaggerOptions);


// Serve Swagger UI at /api-docs endpoint
const swaggerSetup = (app) => app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

export default swaggerSetup;