import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { signup_handler , start_handler} from "./handler";

const { create_note_handler } = require("./handler");

yargs(hideBin(process.argv))
    .command(
        "new <note>",
        "Creates a new Note",
        (yargs) =>
            yargs.positional("note", {
                description: "The content of the note",
                type: "string",
            }),
        (argv) => create_note_handler(argv.note as string),
    )
    .command(
        "signup <username>", 
        "Sign up for a new account",
        (yargs) =>
            yargs.positional("username", {
                description: "The username for the new account",
                type: "string",
            }),
        (argv) => signup_handler(argv.username as string),
    )
    .command(
        "start",
        "Start the service",
        (yargs) => yargs,
        (argv) => start_handler(),
    )
    .parse();
