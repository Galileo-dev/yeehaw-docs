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
let fileService: FileService;

beforeEach(() => {
  userDB = new UserDB(":memory:");
  fileDB = new FileDB(":memory:");
  const AppInstance = app(userDB, fileDB);
  api = treaty(AppInstance);
  authService = new AuthService(userDB);
  fileService = new FileService(userDB, fileDB);
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
});

describe("Username", () => {
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

  it("should get user details by username", async () => {
    await registerTestUser(authService);

    const { data } = await api.user({ username: "testuser" }).get();
    expect(data?.username).toBe("testuser");
    expect(data?.publicKey).toBe("publickey123");
  });

  it("should return null for a non-existing user", async () => {
    const user = await authService.getUser("nonexistent");
    expect(user).toBeNull();
  });

  it("should retrieve all usernames", async () => {
    await authService.register("testuser1", "Password123!", "publickey123", {
      iv: "iv",
      salt: "salt",
      data: "data",
      authTag: "authTag",
    });
    await authService.register("testuser2", "Password123!", "publickey456", {
      iv: "iv",
      salt: "salt",
      data: "data",
      authTag: "authTag",
    });

    const usernames = await authService.getUsers();
    expect(usernames).toEqual(["testuser1", "testuser2"]);
  });
});

describe("Passwords", () => {
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

  it('should allow a user to log in with the correct password', async () => {
    const username = 'testuser';
    const password = 'Password123!';

    await authService.register(username, password, 'publickey123', {
      iv: 'iv',
      salt: 'salt',
      data: 'data',
      authTag: 'authTag',
    });
    const user = await authService.getUser(username);
    if (!user) throw new Error('User not found');

    const isMatch = await authService.checkPassword(password, user.passwordHash);
    expect(isMatch).toBe(true);
  });
});

describe("File Upload and Access", () => {
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

  it("should allow the intended recipient to access the file", async () => {
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

  it("should not allow other users to access the file", async () => {
    await registerTestUser(authService, "fromuser");
    await registerTestUser(authService, "touser");
    await registerTestUser(authService, "anotheruser");

    const file: YeehawFile = {
      fromUsername: "fromuser",
      toUsername: "touser",
      file: mockEncryptedFile,
    };

    await fileService.upload(file);

    const { data: sharedFilesForAnotherUser } = await api.files.shared({ username: "anotheruser" }).get();
    expect(sharedFilesForAnotherUser).toEqual([]);
  });

  it("should return an empty array when no files are shared with the user", async () => {
    await registerTestUser(authService, "nouser");

    const { data } = await api.files.shared({ username: "nouser" }).get();
    expect(data).toEqual([]);
  });
});

describe("File Download and Access", () => {
  it('should allow a user to download a file', async () => {
    await registerTestUser(authService, 'testuser');
    const file: YeehawFile = {
      fromUsername: 'testuser',
      toUsername: 'testuser',
      file: mockEncryptedFile,
    };
    const uploadedFile = await fileService.upload(file);
    expect(uploadedFile.id).toBeDefined();

    if (uploadedFile.id) {
      const downloadedFile = await fileService.download(uploadedFile.id);

      expect(downloadedFile.id).toEqual(uploadedFile.id);
    }
  });

  it('should throw an error when trying to download a non-existent file', async () => {
    expect(fileService.download(9999)).rejects.toThrow('File not found: 9999');
  });

  it('should throw an error when trying to download a file with an invalid ID', async () => {
    expect(fileService.download(-1)).rejects.toThrow();
  });

  it('should download the correct file when multiple files exist', async () => {
    await registerTestUser(authService, 'testuser');
    const mockEncryptedFile2 = { ...mockEncryptedFile, name: "testfile2.txt" };

    const yeehawFile1: YeehawFile = {
      fromUsername: 'testuser',
      toUsername: 'testuser',
      file: mockEncryptedFile,
    };
    const yeehawFile2: YeehawFile = {
      fromUsername: 'testuser',
      toUsername: 'testuser',
      file: mockEncryptedFile2,
    };

    const file1 = await fileService.upload(yeehawFile1);
    const file2 = await fileService.upload(yeehawFile2);

    expect(file1.id).toBeDefined();
    expect(file2.id).toBeDefined();

    if (file1.id && file2.id) {
      const downloadedFile1 = await fileService.download(file1.id);
      expect(downloadedFile1.id).toEqual(file1.id);
  
      const downloadedFile2 = await fileService.download(file2.id);
      expect(downloadedFile2.id).toEqual(file2.id);
    }
  });
});
