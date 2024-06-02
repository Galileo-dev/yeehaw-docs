// test/index.test.ts
import { treaty } from "@elysiajs/eden";
import { beforeEach, describe, expect, it } from "bun:test";
import { App } from "../src";
import { app } from "../src/app";
import { FileDB, YeehawFile } from "../src/db/fileDB";
import { UserDB } from "../src/db/userDB";
import { AuthService } from "../src/services/authService";
import { FileService } from "../src/services/fileService";
import { getJWT, registerTestUser } from "./utils";

const mockEncryptedPrivateKey = {
  iv: Buffer.from([1, 2, 3, 4, 5, 6, 7, 8]).toString("base64"),
  salt: Buffer.from([1, 2, 3, 4, 5, 6, 7, 8]).toString("base64"),
  data: Buffer.from([1, 2, 3, 4, 5, 6, 7, 8]).toString("base64"),
  authTag: Buffer.from([1, 2, 3, 4, 5, 6, 7, 8]).toString("base64"),
};

const mockEncryptedFile = {
  name: "testfile.txt",
  size: 123,
  data: Buffer.from([1, 2, 3, 4, 5, 6, 7, 8]).toString("base64"),
  iv: Buffer.from([1, 2, 3, 4, 5, 6, 7, 8]).toString("base64"),
  salt: Buffer.from([1, 2, 3, 4, 5, 6, 7, 8]).toString("base64"),
  authTag: Buffer.from([1, 2, 3, 4, 5, 6, 7, 8]).toString("base64"),
  encryptedSymmetricKey: Buffer.from([1, 2, 3, 4, 5, 6, 7, 8]).toString(
    "base64"
  ),
  signature: Buffer.from([1, 2, 3, 4, 5, 6, 7, 8]).toString("base64"),
};

let userDB: UserDB;
let fileDB: FileDB;
let api: ReturnType<typeof treaty<App>>;

beforeEach(() => {
  userDB = new UserDB(":memory:");
  fileDB = new FileDB(":memory:");
  const App = app(userDB, fileDB);
  api = treaty(App);
});

describe("Yeehaw Docs E2E", () => {
  it("should return the correct welcome message with version", async () => {
    const { data, error } = await api.index.get();
    expect(data).toBe(
      "Hello, Welcome to the super secure file server\n\n(version: undefined)"
    );
    expect(error).toBeNull();
  });

  it("should register a new user and assign public key", async () => {
    const { data, error } = await api.register.post({
      username: "testuser",
      password: "Password123!",
      publicKey: "publickey123",
      encryptedPrivateKey: mockEncryptedPrivateKey,
    });
    expect(data).toBeDefined();
    expect(data?.username).toBe("testuser");
    expect(data?.publicKey).toBe("publickey123");
    expect(data?.id).toBeDefined();
  });

  it("should not allow registering a user with an existing username", async () => {
    const authService = new AuthService(userDB);
    await registerTestUser(authService);

    const { error } = await api.register.post({
      username: "testuser",
      password: "Password123!",
      publicKey: "anotherkey456",
      encryptedPrivateKey: mockEncryptedPrivateKey,
    });
    expect(error).toBeDefined();
    expect(error?.value).toBe(
      JSON.stringify({ name: "Error", message: "Username is already taken" })
    );
  });

  it("encrypted private key should be stored in the database", async () => {
    const authService = new AuthService(userDB);
    const { data, headers } = await api.register.post({
      username: "testuser",
      password: "Password123!",
      publicKey: "publickey123",
      encryptedPrivateKey: mockEncryptedPrivateKey,
    });

    const { data: fetchedUser, error } = await api
      .user({
        username: "testuser",
      })
      .get({ headers: await getJWT(authService, "testuser") });
    expect(fetchedUser?.encryptedPrivateKey).toEqual(mockEncryptedPrivateKey);
  });

  it("should get user details by username", async () => {
    const authService = new AuthService(userDB);
    await registerTestUser(authService);

    const { data } = await api
      .user({ username: "testuser" })
      .get({ headers: await getJWT(authService, "testuser") });
    expect(data?.username).toBe("testuser");
    expect(data?.publicKey).toBe("publickey123");
  });

  it("should upload a file", async () => {
    const authService = new AuthService(userDB);
    await registerTestUser(authService, "fromuser");
    await registerTestUser(authService, "touser");

    const { error } = await api.upload.post(
      {
        fromUsername: "fromuser",
        toUsername: "touser",
        file: mockEncryptedFile,
      },
      { headers: await getJWT(authService, "fromuser") }
    );
    expect(error).toBeNull();
  });

  it("should get files shared with a user", async () => {
    const authService = new AuthService(userDB);
    const fileService = new FileService(userDB, fileDB);
    await registerTestUser(authService, "fromuser");
    await registerTestUser(authService, "touser");

    const file: YeehawFile = {
      fromUsername: "fromuser",
      toUsername: "touser",
      file: mockEncryptedFile,
    };

    await fileService.upload(file);

    const { data } = await api.files.shared.get({
      headers: await getJWT(authService, "touser"),
    });

    expect(data).toEqual([
      {
        id: 1,
        fromUsername: "fromuser",
        name: "testfile.txt",
        size: mockEncryptedFile.size,
      },
    ]);
  });
});
