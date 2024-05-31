import Bun from "bun";
import { UserDB } from "../db/userDB";

export class AuthService {
  private userDB: UserDB;

  constructor(userDB: UserDB) {
    this.userDB = userDB;
  }

  // Register a new user
  async register(
    username: string,
    password: string,
    publicKey: string,
    encryptedPrivateKey: {
      iv: string;
      salt: string;
      data: string;
      authTag: string;
    }
  ) {
    const passwordHash = await Bun.password.hash(password);

    return this.userDB.addUser({
      username,
      passwordHash,
      publicKey,
      encryptedPrivateKey,
    });
  }

  async getUser(username: string) {
    const user = await this.userDB.getUser(username);
    return user;
  }

  async getUsers() {
    const users = await this.userDB.getUsers();
    // extract usernames from the users
    const usernames = users.map((user) => user.username);
    return usernames;
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
