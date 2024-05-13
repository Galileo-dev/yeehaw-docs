import { FileDB } from "../db/fileDB";
import { User, UserDB } from "../db/userDB";

export class FileService {
  private userDB: UserDB;
  private fileDB: FileDB;

  constructor(userDB: UserDB, fileDB: FileDB) {
    this.userDB = userDB;
    this.fileDB = fileDB;
  }

  // Upload an ecrypted file to the server and assign it to a user
  async upload(from_user_name: string, to_user_name: string, file: File) {
    const fromUser: User | null = await this.userDB.getUser(from_user_name);
    const toUser: User | null = await this.userDB.getUser(to_user_name);

    if (!fromUser || fromUser.id === undefined) {
      throw new Error(`Invalid user: ${from_user_name}`);
    }

    if (!toUser || toUser.id === undefined) {
      throw new Error(`Invalid user: ${to_user_name}`);
    }

    return this.fileDB.addFile({
      from_user_id: fromUser.id,
      to_user_id: toUser.id,
      name: file.name,
      data: file,
    });
  }
}
