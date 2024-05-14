import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { cowboyBoot } from './cowboyBoot';

import { signup_handler } from "./handler";

yargs(hideBin(process.argv))
    .command(
        "start", 
        "Start the CLI",
        () => {
            console.log(cowboyBoot);
            console.log("Howdy Partner! Welcome to Yeehaw-Docs");
            console.log("Commands: 'yeehaw register username' -> signup for a new account");
        }
    )
    .command(
        "register <username>",
        "Sign up for a new account",
        (yargs) => 
            yargs
                .positional("username", {
                    description: "The username for the new account",
                    type: "string",
                }),
        (argv) => signup_handler(argv.username as string),
    )
    .parse();
