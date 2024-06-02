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

  async login(username: string, password: string) {
    const user = await this.userDB.getUser(username);

    if (!user) {
      throw new Error("User not found");
    }

    if (await Bun.password.verify(password, user.passwordHash)) {
      return user;
    }

    throw new Error("Incorrect password");
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

  async getUserFromJwt(jwt: any, set: any, value: string) {
    const userId = ((await jwt.verify(value)) as any).id as number;
    if (!userId) {
      set.status = 401;

      throw new Error("Unauthorized");
    }

    const user = await this.userDB.getUserById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }
}
