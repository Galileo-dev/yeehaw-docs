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
});
