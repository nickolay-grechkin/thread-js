import {
  ControllerHook,
  HttpMethod,
  ImagesApiPath
} from '#libs/enums/enums.js';
import { upload } from '#libs/middlewares/middlewares.js';

const initImageApi = (fastify, options, done) => {
  const { imageService } = options.services;
  fastify.register(upload.contentParser);

  fastify.route({
    method: HttpMethod.POST,
    url: ImagesApiPath.ROOT,
    [ControllerHook.PRE_HANDLER]: upload.single('image'),
    [ControllerHook.HANDLER]: request => imageService.upload(request.file)
  });

  done();
};

export { initImageApi };
