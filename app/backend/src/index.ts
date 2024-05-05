import jwt from "@elysiajs/jwt";
import { swagger } from "@elysiajs/swagger";
import { Elysia, t } from "elysia";
import { FileSharingDatabase } from "./db";

const app = new Elysia()
  .use(swagger())
  .use(
    jwt({
      name: "jwt",
      secret: "Fischl von Luftschloss Narfidort",
    })
  )
  .decorate("db", new FileSharingDatabase())
  .state("version", process.env.npm_package_version)
  .get(
    "/",
    ({ store: { version } }) =>
      `Hello, Welcome to the super secure file server\n\n(version: ${version})`
  )
  .get("/version", ({ store: { version } }) => version)
  .post("/upload", ({ body: { file }, db }) => file, {
    // Validate the request body
    body: t.Object({ file: t.File() }),
  })
  .post(
    "/signup",
    async ({ body: { username, password }, db }) => {
      const password_hash = await Bun.password.hash(password);
      return db.addUser({ username, password_hash });
    },
    {
      // Validate the request body
      body: t.Object({
        username: t.String(),
        password: t.String(),
      }),
    }
  )
  .post(
    "/login",
    async ({ body: { username, password }, db }) => {
      const user = await db.getUser(username);
      if (!user) {
        throw new Error("User not found / Invalid password");
      }

      if (!(await Bun.password.verify(password, user.password_hash))) {
        throw new Error("User not found / Invalid password");
      }
      return user;
    },
    {
      // Validate the request body
      body: t.Object({
        username: t.String(),
        password: t.String(),
      }),
    }
  )
  .listen(3001);

console.log(
  `\n🔥 File sharing is running at http://${app.server?.hostname}:${app.server?.port}...`
);
