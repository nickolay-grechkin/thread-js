import { faker } from '@faker-js/faker';
import { beforeAll, describe, expect, it } from '@jest/globals';

import {
  ApiPath,
  AuthApiPath,
  CommentPayloadKey,
  CommentsApiPath,
  HttpCode,
  HttpMethod,
  PostPayloadKey,
  PostsApiPath,
  UserPayloadKey
} from '#libs/enums/enums.js';
import { joinPath, normalizeTrailingSlash } from '#libs/helpers/helpers.js';
import { config } from '#libs/packages/config/config.js';

import { buildApp } from '../../helpers/helpers.js';

describe(`${normalizeTrailingSlash(
  joinPath(config.ENV.APP.API_PATH, ApiPath.COMMENTS)
)} routes`, () => {
  const app = buildApp();
  let token;
  let commentId;

  const registerEndpoint = normalizeTrailingSlash(
    joinPath(config.ENV.APP.API_PATH, ApiPath.AUTH, AuthApiPath.REGISTER)
  );

  const postsEndpoint = normalizeTrailingSlash(
    joinPath(config.ENV.APP.API_PATH, ApiPath.POSTS, PostsApiPath.ROOT)
  );

  const commentsEndpoint = normalizeTrailingSlash(
    joinPath(config.ENV.APP.API_PATH, ApiPath.POSTS, CommentsApiPath.ROOT)
  );

  const commentEndpoint = normalizeTrailingSlash(
    joinPath(config.ENV.APP.API_PATH, ApiPath.POSTS, CommentsApiPath.$ID)
  );

  const commentReactEndpoint = normalizeTrailingSlash(
    joinPath(config.ENV.APP.API_PATH, ApiPath.COMMENTS, CommentsApiPath.REACT)
  );

  beforeAll(async () => {
    const testUser = {
      [UserPayloadKey.USERNAME]: faker.name.firstName(),
      [UserPayloadKey.EMAIL]: faker.internet.email(),
      [UserPayloadKey.PASSWORD]: faker.internet.password()
    };

    const testPost = {
      [PostPayloadKey.BODY]: faker.lorem.paragraph()
    };

    const testComment = {
      [CommentPayloadKey.BODY]: faker.lorem.paragraph()
    };

    const registerResponse = await app
      .inject()
      .post(registerEndpoint)
      .body(testUser);

    token = registerResponse.json().token;

    const createPostResponse = await app
      .inject()
      .post(postsEndpoint)
      .headers({ authorization: `Bearer ${token}` })
      .body(testPost);

    const { id: postId } = createPostResponse.json();

    const createCommentResponse = await app
      .inject()
      .post(commentsEndpoint)
      .headers({ authorization: `Bearer ${token}` })
      .body({ ...testComment, postId });

    commentId = createCommentResponse.json().id;
  });

  describe(`${commentReactEndpoint} (${HttpMethod.PUT}) endpoint`, () => {
    it(`should return ${HttpCode.OK} with liked comment`, async () => {
      const getCommentBeforeLikeResponse = await app
        .inject()
        .get(commentEndpoint.replace(':id', commentId))
        .headers({ authorization: `Bearer ${token}` });
      const likeCommentResponse = await app
        .inject()
        .put(commentReactEndpoint)
        .headers({ authorization: `Bearer ${token}` })
        .body({ commentId });

      expect(likeCommentResponse.statusCode).toBe(HttpCode.OK);
      expect(likeCommentResponse.json()).toEqual(
        expect.objectContaining({
          likeCount: String(
            Number(getCommentBeforeLikeResponse.json().likeCount) + 1
          ),
          dislikeCount: getCommentBeforeLikeResponse.json().dislikeCount
        })
      );
    });

    it(`should return ${HttpCode.OK} with removed user's like comment`, async () => {
      const getCommentBeforeLikeResponse = await app
        .inject()
        .get(commentEndpoint.replace(':id', commentId))
        .headers({ authorization: `Bearer ${token}` });
      const likeCommentResponse = await app
        .inject()
        .put(commentReactEndpoint)
        .headers({ authorization: `Bearer ${token}` })
        .body({ commentId });

      expect(likeCommentResponse.statusCode).toBe(HttpCode.OK);
      expect(likeCommentResponse.json()).toEqual(
        expect.objectContaining({
          likeCount: String(
            Number(getCommentBeforeLikeResponse.json().likeCount) - 1
          ),
          dislikeCount: getCommentBeforeLikeResponse.json().dislikeCount
        })
      );
    });

    it(`should return ${HttpCode.OK} with disliked comment`, async () => {
      const getCommentBeforeLikeResponse = await app
        .inject()
        .get(commentEndpoint.replace(':id', commentId))
        .headers({ authorization: `Bearer ${token}` });
      const dislikeCommentResponse = await app
        .inject()
        .put(commentReactEndpoint)
        .headers({ authorization: `Bearer ${token}` })
        .body({ commentId, isLike: false });

      expect(dislikeCommentResponse.statusCode).toBe(HttpCode.OK);
      expect(dislikeCommentResponse.json()).toEqual(
        expect.objectContaining({
          likeCount: getCommentBeforeLikeResponse.json().likeCount,
          dislikeCount: String(
            Number(getCommentBeforeLikeResponse.json().dislikeCount) + 1
          )
        })
      );
    });

    it(`should return ${HttpCode.OK} with removed user's dislike comment`, async () => {
      const getCommentBeforeLikeResponse = await app
        .inject()
        .get(commentEndpoint.replace(':id', commentId))
        .headers({ authorization: `Bearer ${token}` });
      const dislikeCommentResponse = await app
        .inject()
        .put(commentReactEndpoint)
        .headers({ authorization: `Bearer ${token}` })
        .body({ commentId, isLike: false });

      expect(dislikeCommentResponse.statusCode).toBe(HttpCode.OK);
      expect(dislikeCommentResponse.json()).toEqual(
        expect.objectContaining({
          likeCount: getCommentBeforeLikeResponse.json().likeCount,
          dislikeCount: String(
            Number(getCommentBeforeLikeResponse.json().dislikeCount) - 1
          )
        })
      );
    });

    it(`should return ${HttpCode.OK} with switched like to dislike comment`, async () => {
      const getCommentBeforeLikeResponse = await app
        .inject()
        .get(commentEndpoint.replace(':id', commentId))
        .headers({ authorization: `Bearer ${token}` });
      const likeCommentResponse = await app
        .inject()
        .put(commentReactEndpoint)
        .headers({ authorization: `Bearer ${token}` })
        .body({ commentId, isLike: true });
      const dislikeCommentResponse = await app
        .inject()
        .put(commentReactEndpoint)
        .headers({ authorization: `Bearer ${token}` })
        .body({ commentId, isLike: false });
      await app
        .inject()
        .put(commentReactEndpoint)
        .headers({ authorization: `Bearer ${token}` })
        .body({ commentId, isLike: false });

      expect(likeCommentResponse.statusCode).toBe(HttpCode.OK);
      expect(dislikeCommentResponse.statusCode).toBe(HttpCode.OK);
      expect(likeCommentResponse.json()).toEqual(
        expect.objectContaining({
          likeCount: String(
            Number(getCommentBeforeLikeResponse.json().likeCount) + 1
          ),
          dislikeCount: getCommentBeforeLikeResponse.json().dislikeCount
        })
      );
      expect(dislikeCommentResponse.json()).toEqual(
        expect.objectContaining({
          likeCount: String(Number(likeCommentResponse.json().likeCount) - 1),
          dislikeCount: String(
            Number(likeCommentResponse.json().dislikeCount) + 1
          )
        })
      );
    });

    it(`should return ${HttpCode.OK} with switched dislike to like comment`, async () => {
      const getCommentBeforeLikeResponse = await app
        .inject()
        .get(commentEndpoint.replace(':id', commentId))
        .headers({ authorization: `Bearer ${token}` });
      const dislikeCommentResponse = await app
        .inject()
        .put(commentReactEndpoint)
        .headers({ authorization: `Bearer ${token}` })
        .body({ commentId, isLike: false });
      const likeCommentResponse = await app
        .inject()
        .put(commentReactEndpoint)
        .headers({ authorization: `Bearer ${token}` })
        .body({ commentId, isLike: true });

      expect(likeCommentResponse.statusCode).toBe(HttpCode.OK);
      expect(dislikeCommentResponse.statusCode).toBe(HttpCode.OK);
      expect(dislikeCommentResponse.json()).toEqual(
        expect.objectContaining({
          likeCount: getCommentBeforeLikeResponse.json().likeCount,
          dislikeCount: String(
            Number(getCommentBeforeLikeResponse.json().dislikeCount) + 1
          )
        })
      );
      expect(likeCommentResponse.json()).toEqual(
        expect.objectContaining({
          likeCount: String(
            Number(dislikeCommentResponse.json().likeCount) + 1
          ),
          dislikeCount: String(
            Number(dislikeCommentResponse.json().dislikeCount) - 1
          )
        })
      );
    });
  });
});
