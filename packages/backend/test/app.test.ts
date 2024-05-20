// test/index.test.ts
import { beforeEach, describe, expect, it } from "bun:test";
import { app } from "../src/app";
import { FileDB } from "../src/db/fileDB";
import { User, UserDB } from "../src/db/userDB";
import { AuthService } from "../src/services/authService";
import { FileService } from "../src/services/fileService";
import { registerTestUser } from "./utils";

let userDB: UserDB;
let fileDB: FileDB;

export function base64ToUint8Array(base64: string): Uint8Array {
  return new Uint8Array(Buffer.from(base64, "base64"));
}

const mockSalt = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8]).toString("base64");
const mockIV = Buffer.from([9, 10, 11, 12, 13, 14, 15, 16]).toString("base64");
const mockAuthTag = Buffer.from([17, 18, 19, 20, 21, 22, 23, 24]).toString(
  "base64"
);
const mockEncryptedPrivateKey = Buffer.from([
  25, 26, 27, 28, 29, 30, 31, 32,
]).toString("base64");

describe("Yeehaw Docs E2E", () => {
  beforeEach(() => {
    userDB = new UserDB(":memory:");
    fileDB = new FileDB(":memory:");
  });

  it("should return the correct welcome message with version", async () => {
    const response = await app(userDB, fileDB)
      .handle(
        new Request("http://localhost:3000/", {
          method: "GET",
        })
      )
      .then((res: Response) => res);

    // should half match the response as the version is undefined in test
    expect(await response.text()).toMatch(
      "Hello, Welcome to the super secure file server\n\n"
    );
  });

  it("should register a new user and assign public key", async () => {
    const response = await app(userDB, fileDB)
      .handle(
        new Request("http://localhost:3000/register", {
          method: "POST",
          body: JSON.stringify({
            username: "testuser",
            password: "Password123!",
            public_key: "publickey123",
            encrypted_private_key: mockEncryptedPrivateKey,
            salt: mockSalt,
            iv: mockIV,
            auth_tag: mockAuthTag,
          }),
          headers: { "Content-Type": "application/json" },
        })
      )
      .then((res: Response) => res);

    expect(response.status).toBe(200);
    const user: User = await response.json();
    expect(user.username).toBe("testuser");
    expect(user.public_key).toBe("publickey123");
    expect(user.id).toBeDefined();
  });

  it("should not allow registering a user with an existing username", async () => {
    const authService = new AuthService(userDB);
    await registerTestUser(authService);

    const response = await app(userDB, fileDB)
      .handle(
        new Request("http://localhost:3000/register", {
          method: "POST",
          body: JSON.stringify({
            username: "testuser",
            password: "Password123!",
            public_key: "anotherkey456",
            encrypted_private_key: mockEncryptedPrivateKey,
            salt: mockSalt,
            iv: mockIV,
            auth_tag: mockAuthTag,
          }),
          headers: { "Content-Type": "application/json" },
        })
      )
      .then((res: Response) => res);

    expect(response.status).toBe(500);
    const error = await response.json();
    expect(error.message).toBe("Username is already taken");
  });

  it("should get user details by username", async () => {
    const authService = new AuthService(userDB);
    await registerTestUser(authService);

    const response = await app(userDB, fileDB)
      .handle(
        new Request("http://localhost:3000/user/testuser", {
          method: "GET",
        })
      )
      .then((res: Response) => res);

    expect(response.status).toBe(200);
    const user = await response.json();
    expect(user.username).toBe("testuser");
    expect(user.public_key).toBe("publickey123");
  });

  it("should upload a file", async () => {
    const authService = new AuthService(userDB);
    await registerTestUser(authService, "fromuser");
    await registerTestUser(authService, "touser");

    const file = new File(["encryptedfilecontent"], "testfile.txt", {
      type: "text/plain",
    });

    const formData = new FormData();
    formData.append("fromUsername", "fromuser");
    formData.append("toUsername", "touser");
    formData.append("file", file);

    const response = await app(userDB, fileDB)
      .handle(
        new Request("http://localhost:3000/upload", {
          method: "POST",
          body: formData,
        })
      )
      .then((res: Response) => res);

    expect(response.status).toBe(200);
  });

  it("should get files shared with a user", async () => {
    const authService = new AuthService(userDB);
    const fileService = new FileService(userDB, fileDB);
    await registerTestUser(authService, "fromuser");
    await registerTestUser(authService, "touser");

    const file = new File(["encryptedfilecontent"], "testfile.txt", {
      type: "text/plain",
    });
    await fileService.upload("fromuser", "touser", file);

    const response = await app(userDB, fileDB)
      .handle(
        new Request("http://localhost:3000/files/shared/touser", {
          method: "GET",
        })
      )
      .then((res: Response) => res);

    expect(response.status).toBe(200);
    const files = await response.json();
    expect(files).toEqual([
      {
        id: 1,
        fromUsername: "fromuser",
        toUsername: "touser",
        name: "testfile.txt",
        size: file.size,
      },
    ]);
  });
});
