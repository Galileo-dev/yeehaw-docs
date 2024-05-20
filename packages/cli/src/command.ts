import chalk from "chalk";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { cowboyBoot } from "./cowboyBoot";
import { signupHandler, uploadHandler } from "./handler";

const log = console.log;

yargs(hideBin(process.argv))
  .updateStrings({
    "Options:": chalk.blue("Options:"),
  })
  .command("$0", false, () => {
    if (process.argv.length > 2) {
      return;
    }
    log(chalk.whiteBright(cowboyBoot));
    log(chalk.green.bold("Howdy Partner! Welcome to Yeehaw-Docs"));
    log(
      chalk.green(
        "Use the --help flag to see the available commands and options"
      )
    );
  })
  .command(
    "register <username> <password>",
    "Sign up for a new account",
    (yargs) =>
      yargs
        .positional("username", {
          description: "The username for the new account",
          type: "string",
          demandOption: true,
        })
        .positional("password", {
          description: "The password for the new account",
          type: "string",
          demandOption: true,
        }),
    (argv) => signupHandler(argv.username, argv.password)
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
  .parse();
