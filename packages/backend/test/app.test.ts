import { beforeEach, describe, expect, it } from "bun:test";
import { app } from "../src/app";
import { FileDB } from "../src/db/fileDB";
import { User, UserDB } from "../src/db/userDB";
import { AuthService } from "../src/services/authService";
import { FileService } from "../src/services/fileService";
import { registerTestUser } from "./utils";

let userDB: UserDB;
let fileDB: FileDB;

const mockEncryptedPrivateKey = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8]).toString(
  "base64"
);

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

    expect(await response.text()).toMatch(
      "Hello, Welcome to the super secure file server\n\n(version: undefined)"
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
          }),
          headers: { "Content-Type": "application/json" },
        })
      )
      .then((res: Response) => res);

    expect(response.status).toBe(500);
    const error = await response.json();
    expect(error.message).toBe("Username is already taken");
  });

  it("encrypted private key should be stored in the database", async () => {
    const response = await app(userDB, fileDB)
      .handle(
        new Request("http://localhost:3000/register", {
          method: "POST",
          body: JSON.stringify({
            username: "testuser",
            password: "Password123!",
            public_key: "publickey123",
            encrypted_private_key: mockEncryptedPrivateKey,
          }),
          headers: { "Content-Type": "application/json" },
        })
      )
      .then((res: Response) => res);

    expect(response.status).toBe(200);
    const user: User = await response.json();
    expect(user.encrypted_private_key).toBe(mockEncryptedPrivateKey);

    const response2 = await app(userDB, fileDB)
      .handle(
        new Request("http://localhost:3000/user/testuser", {
          method: "GET",
        })
      )
      .then((res: Response) => res);

    expect(response2.status).toBe(200);
    const user2: User = await response2.json();
    expect(user2.encrypted_private_key).toBe(mockEncryptedPrivateKey);
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

    const file = {
      name: "testfile.txt",
      size: 10,
      data: "encryptedfilecontent",
      iv: "iv",
      salt: "salt",
      auth_tag: "auth_tag",
    };

    const response = await app(userDB, fileDB)
      .handle(
        new Request("http://localhost:3000/upload", {
          method: "POST",
          body: JSON.stringify({
            fromUsername: "fromuser",
            toUsername: "touser",
            file: file,
          }),
          headers: { "Content-Type": "application/json" },
        })
      )
      .then((res: Response) => res);

    console.log(await response.text());
    expect(response.status).toBe(200);
  });

  it("should get files shared with a user", async () => {
    const authService = new AuthService(userDB);
    const fileService = new FileService(userDB, fileDB);
    await registerTestUser(authService, "fromuser");
    await registerTestUser(authService, "touser");

    const file = {
      fromUsername: "fromuser",
      toUsername: "touser",
      name: "testfile.txt",
      size: 10,
      data: "encryptedfilecontent",
      iv: "iv",
      salt: "salt",
      auth_tag: "auth_tag",
    };

    await fileService.upload(file);

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
        fromUsername: "fromuser",
        name: "testfile.txt",
        size: file.size,
      },
    ]);
  });
});
