import fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import Knex from 'knex';
import { Model } from 'objection';

import { fastifySwagger } from '@fastify/swagger';
import { fastifySwaggerUi } from '@fastify/swagger-ui';
import knexConfig from '../knexfile.js';
import { ENV, ExitCode } from './common/enums/enums.js';
import {
  socketInjector as socketInjectorPlugin
} from './plugins/plugins.js';
import { auth, comment, image, post, user, socket } from './services/services.js';
import { initApi } from './api/api.js';

class App {
  #app;

  constructor(opts) {
    this.#app = this.#initApp(opts);
  }

  get app() {
    return this.#app;
  }

  #initApp(opts) {
    const app = fastify(opts);
    socket.initializeIo(app.server);

    this.#registerPlugins(app);
    this.#initDB();

    return app;
  }

  #registerPlugins(app) {
    app.register(cors, {
      cors: {
        origin: 'http://localhost:3000',
        methods: '*',
        credentials: true
      }
    });

    const staticPath = new URL('../../client/build', import.meta.url);
    app.register(fastifyStatic, {
      root: staticPath.pathname,
      prefix: '/'
    });
    app.register(fastifySwagger, {});
    app.register(fastifySwaggerUi, {
      routePrefix: '/docs',
      swagger: {
        info: {
          title: 'My FirstAPP Documentation',
          description: 'My FirstApp Backend Documentation description',
          version: '0.1.0',
          termsOfService: 'https://mywebsite.io/tos',
          contact: {
            name: 'John Doe',
            url: 'https://www.johndoe.com',
            email: 'john.doe@email.com'
          }
        },
        externalDocs: {
          url: 'https://www.johndoe.com/api/',
          description: 'Find more info here'
        },
        host: '127.0.0.1:3001',
        basePath: '',
        schemes: ['http', 'https'],
        consumes: ['application/json'],
        produces: ['application/json'],
        tags: [{
          name: 'User',
          description: 'User\'s API'
        }],
        definitions: {
          User: {
            type: 'object',
            required: ['id', 'email'],
            properties: {
              id: {
                type: 'number',
                format: 'uuid'
              },
              firstName: {
                type: 'string'
              },
              lastName: {
                type: 'string'
              },
              email: {
                type: 'string',
                format: 'email'
              }
            }
          }
        }
      },
      uiConfig: {
        docExpansion: 'none', // expand/not all the documentations none|list|full
        deepLinking: true
      },
      uiHooks: {
        onRequest(request, reply, next) {
          next();
        },
        preHandler(request, reply, next) {
          next();
        }
      },
      staticCSP: false,
      transformStaticCSP: header => header,
      exposeRoute: true
    });
    app.register(socketInjectorPlugin, { io: socket.io });
    app.register(initApi, {
      services: {
        auth,
        comment,
        image,
        post,
        user
      },
      prefix: ENV.APP.API_PATH
    });

    app.setNotFoundHandler((req, res) => {
      res.sendFile('index.html');
    });
  }

  #initDB() {
    const knex = Knex(knexConfig);
    Model.knex(knex);
  }

  start = async () => {
    try {
      await this.#app.listen(ENV.APP.PORT);
    } catch (err) {
      this.#app.log.error(err);
      process.exit(ExitCode.ERROR);
    }
  };
}

export { App };
