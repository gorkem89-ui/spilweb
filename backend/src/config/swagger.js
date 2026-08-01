import swaggerJSDoc from 'swagger-jsdoc';
import { env } from './env.js';

export const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Spilweb API',
      version: '0.1.0',
      description: 'Sprint 1 API documentation for the Spilweb platform.'
    },
    servers: [
      {
        url: env.appUrl,
        description: env.nodeEnv
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./src/routes/*.js']
});
