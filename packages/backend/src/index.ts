import ora from "ora";
import { app } from "./app";
import { FileDB } from "./db/fileDB";
import { UserDB } from "./db/userDB";

const spinner = ora({
  discardStdin: false,
  text: "Loading database...",
}).start();
const userDB = new UserDB();
const fileDB = new FileDB();

const App = app(userDB, fileDB).listen(30001);

// if not in test mode
if (process.env.NODE_ENV !== "test") {
  Promise.all([userDB.healthCheck(), fileDB.healthCheck()]).then(() => {
    spinner.succeed("User database is running");
    spinner.succeed("File database is running");

    console.log(
      `\n🔥 File sharing is running at http://${App.server?.hostname}:${App.server?.port}...`
    );
  });
}
