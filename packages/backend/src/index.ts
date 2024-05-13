import { swagger } from "@elysiajs/swagger";
import Database from "bun:sqlite";
import { Elysia, t } from "elysia";
import { FileDB } from "./db/fileDB";
import { UserDB } from "./db/userDB";
import { AuthService } from "./services/authService";
import { FileService } from "./services/fileService";

const db = new Database("file-server.db");
const userDB = new UserDB(db);
const fileDB = new FileDB(db);

const app = new Elysia()
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
    "/upload",
    ({ body: { fromUser, toUser, file }, fileService }) => {
      fileService.upload(fromUser, toUser, file);
    },
    {
      // Validate the request body
      body: t.Object(
        {
          fromUser: t.String(),
          toUser: t.String(),
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
  .post(
    "/register",
    async ({ body: { username, public_key }, authService }) => {
      return authService.register(username, public_key);
    },
    {
      // Validate the request body
      body: t.Object(
        {
          username: t.String(),
          public_key: t.String(),
        },
        {
          description: "Expected an username and public key",
        }
      ),
      detail: {
        summary: "Create a new user and assign a public key",
        tags: ["authentication"],
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
    }
  )
  .listen(3001);

console.log(
  `\n🔥 File sharing is running at http://${app.server?.hostname}:${app.server?.port}...`
);

export type App = typeof app;
