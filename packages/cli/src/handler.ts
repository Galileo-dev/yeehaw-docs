import { create_new_note } from "./db";
import { create_new_user } from "./db";

export function create_note_handler(note: string) {
    try {
        create_new_note(note);
        console.log(`${note} added successfully`);
    } catch (err) {
        console.error(err);
        console.error("Oops, Error!");
    }
}

export function signup_handler(username: string) {
    try {
        create_new_user(username);
        console.log(`User ${username} registered successfully`);
    } catch (err) {
        console.error(err);
        console.error("Oops, Error!");
    }

}

export function start_handler() {
    console.log("Welcome to our service!");
    console.log("ASCII IMAGE HERE");
    console.log("type: 'yeehaw");
}