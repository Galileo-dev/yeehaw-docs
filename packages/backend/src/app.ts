import jwt from "@elysiajs/jwt";
import { swagger } from "@elysiajs/swagger";
import { Elysia, t } from "elysia";
import { rateLimit } from "elysia-rate-limit";
import { PasswordModel, UsernameModel } from "../models";
import { FileDB } from "./db/fileDB";
import { UserDB } from "./db/userDB";
import { AuthService } from "./services/authService";
import { FileService } from "./services/fileService";

export const app = (userDB: UserDB, fileDB: FileDB) =>
  new Elysia()
    .use(swagger())
    .use(
      jwt({
        name: "jwt",
        secret: process.env.JWT_SECRET!,
      })
    )
    .use(
      rateLimit({
        duration: 60000,
        max: 15,
      })
    )
    .decorate({ authService: new AuthService(userDB) })
    .decorate({ fileService: new FileService(userDB, fileDB) })
    .state("version", process.env.npm_package_version)
    .get(
      "/",
      ({ store: { version } }) =>
        `Hello, Welcome to the super secure file server\n\n(version: ${version})`
    )
    .get("/version", ({ store: { version } }) => version)
    .post(
      "/register",
      async ({
        jwt,
        cookie: { auth },
        body: { username, password, publicKey, encryptedPrivateKey },
        authService,
      }) => {
        if (!(await authService.checkUsernameAvailability(username))) {
          throw new Error("Username is already taken");
        }
        const user = await authService.register(
          username,
          password,
          publicKey,
          encryptedPrivateKey
        );

        if (user.id) {
          auth.set({
            value: await jwt.sign({ id: user.id }),
            httpOnly: true,
            maxAge: 7 * 86400, // 7 days
            path: "/",
          });
        }

        return user;
      },
      {
        // Validate the request body
        body: t.Object(
          {
            username: UsernameModel,
            password: PasswordModel,
            publicKey: t.String(),
            encryptedPrivateKey: t.Object({
              iv: t.String(),
              salt: t.String(),
              data: t.String(),
              authTag: t.String(),
            }),
          },
          {
            description: "Expected a username and public key",
          }
        ),
        detail: {
          summary: "Create a new user and assign a public key",
          tags: ["User"],
        },
      }
    )
    .post(
      "/login",
      async ({
        jwt,
        cookie: { auth },
        body: { username, authPassword },
        authService,
      }) => {
        const user = await authService.login(username, authPassword);

        if (user.id) {
          auth.set({
            value: await jwt.sign({ id: user.id }),
            httpOnly: true,
            maxAge: 7 * 86400, // 7 days
            path: "/",
          });
        }

        return user;
      },
      {
        body: t.Object(
          {
            username: UsernameModel,
            authPassword: PasswordModel,
          },
          {
            description: "Expected a username and password",
          }
        ),
        detail: {
          summary: "Login with a username and password",
          tags: ["User"],
        },
      }
    )
    .guard(
      {
        async beforeHandle({ jwt, set, cookie: { auth } }) {
          if (!(await jwt.verify(auth.value)))
            return (set.status = "Unauthorized");
        },
      },
      (app) =>
        app

          .get(
            "/user/:username",
            async ({ params: { username }, authService }) => {
              return authService.getUser(username);
            },
            {
              // Validate the request parameters
              params: t.Object({ username: t.String() }),
              detail: {
                summary: "Get a user by username",
                tags: ["User"],
              },
            }
          )
          .get(
            "/users",
            async ({ authService }) => {
              return authService.getUsers();
            },
            {
              detail: {
                summary: "Get all users",
                tags: ["User"],
              },
            }
          )
          .post(
            "/upload",
            ({ body: { fromUsername, toUsername, file }, fileService }) => {
              return fileService.upload({
                fromUsername,
                toUsername,
                file,
              });
            },
            {
              // Validate the request body
              body: t.Object(
                {
                  fromUsername: UsernameModel,
                  toUsername: UsernameModel,
                  file: t.Object({
                    name: t.String(),
                    size: t.Number(),
                    data: t.String(),
                    iv: t.String(),
                    authTag: t.String(),
                    encryptedSymmetricKey: t.String(),
                  }),
                },
                {
                  description:
                    "Expected a file encrypted with a shared key between the fromUser and toUser user",
                }
              ),
              detail: {
                summary:
                  "Upload an ecrypted file to the server and assign it to a user",
                tags: ["file"],
              },
            }
          )
          .get(
            "/download/:id",
            async ({
              jwt,
              set,
              cookie: { auth },
              params: { id },
              fileService,
              authService,
            }) => {
              const user = await authService.getUserFromJwt(
                jwt,
                set,
                auth.value
              );

              // check users permission to download file

              return fileService.download(id, user.username);
            },
            {
              params: t.Object({ id: t.Numeric() }),
              detail: {
                summary: "Download a file by ID",
                tags: ["file"],
              },
            }
          )
          .get(
            "/files/shared",
            async ({
              jwt,
              set,
              cookie: { auth },
              fileService,
              authService,
            }) => {
              const user = await authService.getUserFromJwt(
                jwt,
                set,
                auth.value
              );
              return fileService.getSharedFiles(user.username);
            },
            {
              detail: {
                summary: "Get all files shared with a user",
                tags: ["file"],
              },
            }
          )
    );
