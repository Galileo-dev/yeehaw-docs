import chalk from "chalk";
import * as readlineSync from "readline-sync";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { cowboyBoot } from "./cowboyBoot";
const read = require("read");

import {
  checkHandler,
  downloadHandler,
  loginHandler,
  signupHandler,
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
      yargs.positional("username", {
        description: "The username for the new account",
        type: "string",
        demandOption: true,
      }),

    async (argv) => {
      const password = readlineSync.question("Enter Your Password: ", {
        hideEchoBack: true,
        mask: "",
      });
      await signupHandler(argv.username, password);
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
      const password = readlineSync.question("Enter Your Password: ", {
        hideEchoBack: true,
        mask: "",
      });
      await loginHandler(argv.username, password);
    }
  )
  .command(
    "upload <file> <recipient> <sender>",
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
          demandOption: true,
        })
        .positional("sender", {
          description: "The username of the sender",
          type: "string",
          demandOption: true,
        }),
    (argv) => uploadHandler(argv.file, argv.recipient, argv.sender)
  )
  .command(
    "users",
    "List all users",
    (yargs) => yargs,
    (argv) => {
      usersHandler();
    }
  )
  .command(
    "check <username>",
    "Check what files are available for a user",
    (yargs) =>
      yargs.positional("username", {
        description: "The username of the user",
        type: "string",
        demandOption: true,
      }),
    (argv) => {
      checkHandler(argv.username);
    }
  )
  .command(
    "download <fileId> <recipient>",
    "Download a file from a recipient",
    (yargs) =>
      yargs
        .positional("fileId", {
          description: "The id of the file",
          type: "number",
          demandOption: true,
        })
        .positional("recipient", {
          description: "The recipient's username",
          type: "string",
          demandOption: true,
        }),

    (argv) => {
      downloadHandler(argv.fileId, argv.recipient);
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
  .parse();
