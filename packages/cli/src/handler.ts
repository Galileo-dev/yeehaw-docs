import { create_new_user } from "./db";

export function signup_handler(username: string, password: string) {
    try {
        create_new_user(username, password);
        console.log(`User ${username} created successfully`);
    } catch (err) {
        console.error(err);
        console.error("Oops, Error!");
    }
}