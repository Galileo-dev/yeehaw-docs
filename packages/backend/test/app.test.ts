import { treaty } from "@elysiajs/eden";
import { beforeEach, describe, expect, it } from "bun:test";
import { App } from "../src";
import { app } from "../src/app";
import { FileDB, YeehawFile } from "../src/db/fileDB";
import { UserDB } from "../src/db/userDB";
import { AuthService } from "../src/services/authService";
import { FileService } from "../src/services/fileService";
import { registerTestUser } from "./utils";

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
  encryptedSymmetricKey: Buffer.from([1, 2, 3, 4, 5, 6, 7, 8]).toString("base64"),
  signature: Buffer.from([1, 2, 3, 4, 5, 6, 7, 8]).toString("base64"),
};
const passwordRequirements = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

let userDB: UserDB;
let fileDB: FileDB;
let api: ReturnType<typeof treaty<App>>;
let authService: AuthService;

beforeEach(() => {
  userDB = new UserDB(":memory:");
  fileDB = new FileDB(":memory:");
  const AppInstance = app(userDB, fileDB);
  api = treaty(AppInstance);
  authService = new AuthService(userDB);
});

describe("Yeehaw Docs E2E", () => {
  it("should return the correct welcome message with version", async () => {
    const { data, error } = await api.index.get();
    expect(data).toBe("Hello, Welcome to the super secure file server\n\n(version: undefined)");
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
    await registerTestUser(authService);

    const { error } = await api.register.post({
      username: "testuser",
      password: "Password123!",
      publicKey: "anotherkey456",
      encryptedPrivateKey: mockEncryptedPrivateKey,
    });
    expect(error).toBeDefined();
    expect(error?.value).toBe(JSON.stringify({ name: "Error", message: "Username is already taken" }));
  });

  it("should not allow creating a password that doesn't meet the requirements", async () => {
    const weakPassword = "weak1";
    const { error } = await api.register.post({
      username: "testuser",
      password: weakPassword,
      publicKey: "publickey123",
      encryptedPrivateKey: mockEncryptedPrivateKey,
    });

    const isPasswordStrong = passwordRequirements.test(weakPassword);
    expect(isPasswordStrong).toBe(false);
    expect(error).toBeDefined();
    expect(error?.value).toMatch(/Expected string length greater or equal to 8/);
    expect(error?.value).toMatch(/Expected string to match/);
  });

  it('should not allow a user to log in with the wrong password', async () => {
    const username = 'testuser';
    const correctPassword = 'Password123!';
    const wrongPassword = 'WrongPassword123!';

    await authService.register(username, correctPassword, 'publickey123', {
      iv: 'iv',
      salt: 'salt',
      data: 'data',
      authTag: 'authTag',
    });

    const user = await authService.getUser(username);
    if (!user) throw new Error('User not found');

    const isMatch = await authService.checkPassword(wrongPassword, user.passwordHash);
    expect(isMatch).toBe(false);
  });

  it("encrypted private key should be stored in the database", async () => {
    await api.register.post({
      username: "testuser",
      password: "Password123!",
      publicKey: "publickey123",
      encryptedPrivateKey: mockEncryptedPrivateKey,
    });

    const { data: fetchedUser } = await api.user({ username: "testuser" }).get();
    expect(fetchedUser?.encryptedPrivateKey).toEqual(mockEncryptedPrivateKey);
  });

  it("should get user details by username", async () => {
    await registerTestUser(authService);

    const { data } = await api.user({ username: "testuser" }).get();
    expect(data?.username).toBe("testuser");
    expect(data?.publicKey).toBe("publickey123");
  });

  it("should upload a file", async () => {
    await registerTestUser(authService, "fromuser");
    await registerTestUser(authService, "touser");

    const { error } = await api.upload.post({
      fromUsername: "fromuser",
      toUsername: "touser",
      file: mockEncryptedFile,
    });
    expect(error).toBeNull();
  });

  it("should get files shared with a user", async () => {
    const fileService = new FileService(userDB, fileDB);
    await registerTestUser(authService, "fromuser");
    await registerTestUser(authService, "touser");

    const file: YeehawFile = {
      fromUsername: "fromuser",
      toUsername: "touser",
      file: mockEncryptedFile,
    };

    await fileService.upload(file);

    const { data } = await api.files.shared({ username: "touser" }).get();

    expect(data).toEqual([{
      id: 1,
      fromUsername: "fromuser",
      name: "testfile.txt",
      size: mockEncryptedFile.size,
    }]);
  });
});
