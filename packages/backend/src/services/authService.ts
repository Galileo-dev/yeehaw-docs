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
    public_key: string,
    encrypted_private_key: Buffer,
    salt: Buffer,
    iv: Buffer,
    auth_tag: Buffer
  ) {
    const password_hash = await Bun.password.hash(password);
    return this.userDB.addUser({
      username,
      password_hash,
      public_key,
      encrypted_private_key,
      salt,
      iv,
      auth_tag,
    });
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
