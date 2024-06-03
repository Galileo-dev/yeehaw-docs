import { describe, expect, it } from "bun:test";
import { decryptPrivateKey, encryptPrivateKey } from "../src/crypto";

describe("Encryption and Decryption", () => {
  const privateKey = "mySuperSecretPrivateKey";
  const password = "strongPassword123";

  it("should encrypt and decrypt the private key correctly", async () => {
    const encryptedPrivateKey = await encryptPrivateKey(privateKey, password);

    const decryptedPrivateKey = await decryptPrivateKey(
      password,
      encryptedPrivateKey
    );
    expect(decryptedPrivateKey).toEqual(privateKey);
  });

  it("should fail decryption with incorrect password", async () => {
    const encryptedPrivateKey = await encryptPrivateKey(privateKey, password);
    const wrongPassword = "incorrectPassword";

    try {
      await decryptPrivateKey(wrongPassword, encryptedPrivateKey);
    } catch (err: any) {
      expect(err.message).toEqual(
        "Unsupported state or unable to authenticate data"
      );
    }
  });
  it("should handle empty private key", async () => {
    const privateKey = "";
    const password = "strongPassword123";

    const encryptedPrivateKey = await encryptPrivateKey(privateKey, password);
    const decryptedPrivateKey = await decryptPrivateKey(password, encryptedPrivateKey);

    expect(decryptedPrivateKey).toEqual(privateKey);
  });

  it("should handle empty password", async () => {
    const privateKey = "mySuperSecretPrivateKey";
    const password = "";

    const encryptedPrivateKey = await encryptPrivateKey(privateKey, password);
    const decryptedPrivateKey = await decryptPrivateKey(password, encryptedPrivateKey);

    expect(decryptedPrivateKey).toEqual(privateKey);
  });

  it("should handle special characters", async () => {
    const privateKey = "my$uper$ecretPrivateKey!";
    const password = "str0ngP@ssword123!";

    const encryptedPrivateKey = await encryptPrivateKey(privateKey, password);
    const decryptedPrivateKey = await decryptPrivateKey(password, encryptedPrivateKey);

    expect(decryptedPrivateKey).toEqual(privateKey);
  });
});
