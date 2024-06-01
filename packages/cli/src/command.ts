import chalk from "chalk";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { cowboyBoot } from "./cowboyBoot";
import { PasswordModel } from "@backend/models";
const read = require('read');
import * as readlineSync from 'readline-sync';


import {
  checkHandler,
  downloadHandler,
  loginHandler,
  signupHandler,
  uploadHandler,
  usersHandler,
} from "./handler";

async function validatePassword(password: string): Promise<void> {
  if (typeof PasswordModel.pattern === 'undefined') {
    throw new Error('Password pattern is undefined');
  }
  const passwordRegex = new RegExp(PasswordModel.pattern);
  if (!passwordRegex.test(password)) {
    throw new Error(PasswordModel.description);
  }
}

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
        }),

    async (argv) => {
      const password = readlineSync.question('Enter Your Password: ', {
        hideEchoBack: true, 
        mask: '' 
      });
        await validatePassword(password);
        signupHandler(argv.username, password);
    })

  .command(
    "login <username>",
    "login to an existing account",
    (yargs) =>
      yargs
        .positional("username", {
          description: "The username for the account",
          type: "string",
          demandOption: true,
        }),
    async (argv) => {
      const password = readlineSync.question('Enter Your Password: ', {
        hideEchoBack: true, 
        mask: '' 
      });
      await validatePassword(password);
      loginHandler(argv.username, password);
    })
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
  .fail(false);
try {
  await parser.parse();
} catch (err) {
  if (err instanceof Error) {
    console.error(err.message);
  } else {
    console.error(err);
  }
}
