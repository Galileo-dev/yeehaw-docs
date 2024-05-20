import { UserDB } from "../db/userDB";
import Bun from "bun";

export class AuthService {
  private userDB: UserDB;

  constructor(userDB: UserDB) {
    this.userDB = userDB;
  }

  // Register a new user
  async register(username: string, password: string, public_key: string) {
    return this.userDB.addUser({ username, password, public_key });
  }

  // Get a user by username
  async getUser(username: string) {
    const user = await this.userDB.getUser(username);
    return user;
  }

  async checkUsernameAvailability(username: string) {
    const user = await this.userDB.getUser(username);
    return !user;
  }

  async checkPassword(password: string, hash: string) {
    const isMatch = await Bun.password.verify(password, hash);
    return isMatch;
  }
}
