import { swagger } from "@elysiajs/swagger";
import { Elysia, t } from "elysia";
import { UsernameModel } from "../models";
import { FileDB } from "./db/fileDB";
import { UserDB } from "./db/userDB";
import { AuthService } from "./services/authService";
import { FileService } from "./services/fileService";

export const app = (userDB: UserDB, fileDB: FileDB) =>
  new Elysia()
    .use(swagger())
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
      async ({ body: { username, public_key }, authService }) => {
        if (!(await authService.checkUsernameAvailability(username))) {
          throw new Error("Username is already taken");
        }

        return authService.register(username, public_key);
      },
      {
        // Validate the request body
        body: t.Object(
          {
            username: UsernameModel,
            public_key: t.String(),
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
    .post(
      "/upload",
      ({ body: { from_user_name, to_user_name, file }, fileService }) => {
        return fileService.upload(from_user_name, to_user_name, file);
      },
      {
        // Validate the request body
        body: t.Object(
          {
            from_user_name: t.String(),
            to_user_name: t.String(),
            file: t.File(),
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
      "/files/shared/:username",
      async ({ params: { username }, fileService }) => {
        return fileService.getSharedFiles(username);
      },
      {
        params: t.Object({ username: t.String() }),
        detail: {
          summary: "Get all files shared with a user",
          tags: ["file"],
        },
      }
    );