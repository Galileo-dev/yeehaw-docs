import input from "@inquirer/input";
import password from "@inquirer/password";
import chalk from "chalk";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { cowboyBoot } from "./cowboyBoot";

import {
  checkHandler,
  downloadHandler,
  loginHandler,
  logoutHandler,
  signupHandler,
  switchUserHandler,
  uploadHandler,
  usersHandler,
} from "./handler";

const log = console.log;

const parser = yargs(hideBin(process.argv))
  .updateStrings({
    "Options:": chalk.blue("Options:"),
  })
  .command(
    "register <username>",
    "Sign up for a new account",
    (yargs) =>
      yargs
        .positional("username", {
          description: "The username for the new account",
          type: "string",
          demandOption: true,
        })
        .option("authPassword", {
          alias: "p",
          description:
            "The password for the new account. (min 8 chars, with uppercase, lowercase, number, and special character.)",
          type: "string",
        })
        .option("masterPassword", {
          alias: "m",
          description:
            "The master password for the new account. (min 8 chars, with uppercase, lowercase, number, and special character.)",
          type: "string",
        }),

    async (argv) => {
      let authPassword = argv.authPassword;
      if (!authPassword) {
        authPassword = await password({
          message:
            "Enter a auth password: (min 8 chars, with uppercase, lowercase, number, and special character.)",
        });
      }
      let masterPassword = argv.masterPassword;
      if (!masterPassword) {
        masterPassword = await password({
          message:
            "Enter a master password: (min 8 chars, with uppercase, lowercase, number, and special character.)",
        });
      }
      await signupHandler(argv.username, authPassword, masterPassword);
    }
  )

  .command(
    "login <username>",
    "login to an existing account",
    (yargs) =>
      yargs.positional("username", {
        description: "The username for the account",
        type: "string",
        demandOption: true,
      }),
    async (argv) => {
      const authPassword = await password({
        message: "Enter your auth password",
      });

      const masterPassword = await password({
        message: "Enter your master password",
      });

      await loginHandler(argv.username, authPassword, masterPassword);
    }
  )
  .command(
    "upload <file>",
    "Upload a file to a recipient",
    (yargs) =>
      yargs
        .positional("file", {
          description: "The path to the file to upload",
          type: "string",
          demandOption: true,
        })
        .positional("recipient", {
          description: "The username of the recipient",
          type: "string",
          demandOption: false,
        })
        .option("masterPassword", {
          alias: "m",
          description: "The master password for the account",
          type: "string",
        }),
    async (argv) => {
      let recipient = argv.recipient;
      if (!recipient) {
        recipient = await input({
          message: "Enter the username of the recipient",
        });
      }

      let masterPassword = argv.masterPassword;
      if (!masterPassword) {
        masterPassword = await password({
          message:
            "Enter a master password: (min 8 chars, with uppercase, lowercase, number, and special character.)",
        });
      }

      await uploadHandler(argv.file, recipient, masterPassword);
    }
  )
  .command(
    "switch <username>",
    "Switch to another user",
    (yargs) =>
      yargs.positional("username", {
        description: "The username of the user you want to switch to",
        type: "string",
        demandOption: true,
      }),
    async (argv) => switchUserHandler(argv.username)
  )
  .command(
    "users",
    "List all users",
    (yargs) => yargs,
    async (argv) => {
      await usersHandler();
    }
  )
  .command(
    "logout <username>",
    "Logout a user",
    (yargs) =>
      yargs.positional("username", {
        description: "The username of the user you want to logout",
        type: "string",
        demandOption: true,
      }),
    async (argv) => {
      await logoutHandler(argv.username);
    }
  )
  .command(
    "check",
    "Check what files are available for a user",
    (yargs) =>
      yargs.positional("username", {
        description: "The username of the user",
        type: "string",
        demandOption: true,
      }),
    async (argv) => {
      await checkHandler();
    }
  )
  .command(
    "download <fileId>",
    "Download a file",
    (yargs) =>
      yargs.positional("fileId", {
        description: "The id of the file",
        type: "number",
        demandOption: true,
      }),
    async (argv) => {
      await downloadHandler(argv.fileId);
    }
  )
  .command(
    "$0",
    "The default command",
    (yargs) => yargs,
    (argv) => {
      if (argv._.length > 0) {
        log(chalk.redBright("Unknown command"));
        log(
          chalk.redBright("Use the --help flag to see the available commands")
        );
        process.exit(1);
      }

      log(chalk.whiteBright(cowboyBoot));
      log(chalk.green.bold("Howdy Partner! Welcome to Yeehaw-Docs"));
      log(
        chalk.green(
          "Use the --help flag to see the available commands and options"
        )
      );
    }
  )
  .showHelpOnFail(false, "Use --help for available options");

try {
  const argv = await parser.parse();
} catch (err: any) {
  console.error(err);
}
