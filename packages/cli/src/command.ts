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
            console.log("type", "yeehaw register 'username' 'password' ", "to signup for a new account");
        }
    )
    .command(
        "register <username> <password>",
        "Sign up for a new account",
        (yargs) => 
            yargs
                .positional("username", {
                    description: "The username for the new account",
                    type: "string",
                })
                .positional("password", {
                    description: "The password for the new account",
                    type: "string",
                }),
        (argv) => signup_handler(argv.username as string, argv.password as string),
    )
    .parse();
