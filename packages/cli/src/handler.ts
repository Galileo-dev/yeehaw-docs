import { create_new_user } from "./db";
export function signup_handler(username: string, password: string) {
    try {
        create_new_user(username, password);
        console.log(`User ${username} created successfully`);
    } catch (err) {
        if (err instanceof Error) {
            console.error(`Error: ${err.message}`);
        } else {
            console.error(`An unexpected error occurred: ${err}`);
        }
    }
}