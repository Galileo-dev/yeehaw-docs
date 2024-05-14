import { FileDB } from "../db/fileDB";
import { User, UserDB } from "../db/userDB";

export class FileService {
  private userDB: UserDB;
  private fileDB: FileDB;

  constructor(userDB: UserDB, fileDB: FileDB) {
    this.userDB = userDB;
    this.fileDB = fileDB;
  }

  // Upload an encrypted file to the server and assign it to a user
  async upload(fromUsername: string, toUsername: string, file: File) {
    const fromUser: User | null = await this.userDB.getUser(fromUsername);
    const toUser: User | null = await this.userDB.getUser(toUsername);

    if (!fromUser || fromUser.id === undefined) {
      throw new Error(`Invalid user: ${fromUsername}`);
    }

    if (!toUser || toUser.id === undefined) {
      throw new Error(`Invalid user: ${toUsername}`);
    }

    return this.fileDB.addFile({
      fromUsername: fromUser.username,
      toUsername: toUser.username,
      name: file.name,
      size: file.size,
      data: file,
    });
  }

  // Get all files available for a user
  async getSharedFiles(username: string) {
    const user: User | null = await this.userDB.getUser(username);

    if (!user || user.id === undefined) {
      throw new Error(`Invalid user: ${username}`);
    }

    const files = this.fileDB.getSharedFiles(user.username);
    // replacee the user id's with the usernames
    return files;
  }
}
