import chalk from "chalk";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { cowboyBoot } from "./cowboyBoot";
import { signup_handler } from "./handler";

const log = console.log;

yargs(hideBin(process.argv))
  .updateStrings({
    "Options:": chalk.blue("Options:"),
  })
  .command("start", "Start the CLI", (yargs) => {
    log(chalk.whiteBright(cowboyBoot));
    log(chalk.green.bold("Howdy Partner! Welcome to Yeehaw-Docs"));
    yargs.showHelp();
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
    (argv) => signup_handler(argv.username)
    )
      .command(
    "upload <file>",
    "Upload a file",
    (yargs) =>
      yargs.positional("file", {
        description: "The path to the file to upload",
        type: "string",
        demandOption: true,
      }),
    (argv) => upload_handler(argv.file)
  )
  .parse();
