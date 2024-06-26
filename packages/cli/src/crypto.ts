import * as crypto from "crypto";

/**
 * Derives a key from a password and salt using PBKDF2
 **/
export async function deriveKey(
  password: string,
  salt: string,
  iterations: number = 210000,
  keyLength: number = 32,
  digest: string = "sha512"
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(
      password,
      salt,
      iterations,
      keyLength,
      digest,
      (err, derivedKey) => {
        if (err) reject(err);
        resolve(derivedKey);
      }
    );
  });
}

/**
 * Generates a new RSA key pair
 **/
export function generateKeyPair(): Promise<{
  publicKey: string;
  privateKey: string;
}> {
  return new Promise((resolve, reject) => {
    crypto.generateKeyPair(
      "rsa",
      {
        modulusLength: 4096,
        publicKeyEncoding: { type: "spki", format: "pem" },
        privateKeyEncoding: { type: "pkcs8", format: "pem" },
      },
      (err, publicKey, privateKey) => {
        if (err) reject(err);
        resolve({ publicKey, privateKey });
      }
    );
  });
}

// ============================================================
// functions that are used to encrypt and decrypt private keys
// ============================================================

export async function encryptPrivateKey(
  privateKey: string,
  password: string
): Promise<{
  iv: string;
  salt: string;
  data: string;
  authTag: string;
}> {
  const salt = crypto.randomBytes(16);
  const key = await deriveKey(password, salt.toString("base64"));
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encryptedPrivateKey = Buffer.concat([
    cipher.update(privateKey, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return {
    iv: iv.toString("base64"),
    salt: salt.toString("base64"),
    data: encryptedPrivateKey.toString("base64"),
    authTag: authTag.toString("base64"),
  };
}

export async function decryptPrivateKey(
  password: string,
  {
    iv,
    salt,
    data,
    authTag,
  }: {
    iv: string;
    salt: string;
    data: string;
    authTag: string;
  }
): Promise<string> {
  try {
    const key = await deriveKey(password, salt);
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      key,
      Buffer.from(iv, "base64")
    );
    decipher.setAuthTag(Buffer.from(authTag, "base64"));

    let decrypted = decipher.update(
      Buffer.from(data, "base64"),
      undefined,
      "utf8"
    );
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (err) {
    throw new Error("Invalid password");
  }
}

// ========================================================
// function used to encrypt and decrypt data using AES-GCM
// ========================================================

export function encryptData(
  data: Buffer,
  symmetricKey: Buffer
): { encryptedData: Buffer; iv: Buffer; authTag: Buffer } {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", symmetricKey, iv);
  const encryptedData = Buffer.concat([cipher.update(data), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    encryptedData,
    iv,
    authTag,
  };
}

export function decryptData(
  encryptedData: Buffer,
  symmetricKey: Buffer,
  iv: Buffer,
  authTag: Buffer
): Buffer {
  const decipher = crypto.createDecipheriv("aes-256-gcm", symmetricKey, iv);
  decipher.setAuthTag(authTag);
  const decryptedData = Buffer.concat([
    decipher.update(encryptedData),
    decipher.final(),
  ]);

  return decryptedData;
}

// ===============================================================
// functions used to encrypt and decrypt symmetric keys using RSA
// ===============================================================

export function encryptSymmetricKey(
  symmetricKey: Buffer,
  publicKey: string
): Buffer {
  return crypto.publicEncrypt(publicKey, symmetricKey);
}

export function decryptSymmetricKey(
  encryptedSymmetricKey: Buffer,
  privateKey: string
): Buffer {
  return crypto.privateDecrypt(privateKey, encryptedSymmetricKey);
}
