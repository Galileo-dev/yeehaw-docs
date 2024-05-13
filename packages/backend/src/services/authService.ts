import { UserDB } from "../db/userDB";

export class AuthService {
  private userDB: UserDB;

  constructor(userDB: UserDB) {
    this.userDB = userDB;
  }

  // Register a new user
  async register(username: string, public_key: string) {
    return this.userDB.addUser({ username, public_key });
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
}
