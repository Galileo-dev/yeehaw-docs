import { treaty } from "@elysiajs/eden";
import { generateKeyPairSync } from "crypto";
import type { App } from "../../backend/src";
import { createNewUser } from "./db";

const app = treaty<App>("localhost:3001");

export async function signup_handler(username: string) {
  const { publicKey, privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 4096,
    publicKeyEncoding: {
      type: "spki",
      format: "pem",
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem",
    },
  });

  const { data, error } = await app.register.post({
    username,
    public_key: publicKey,
  });

  if (error || !data) {
    console.error(error);
    return;
  }

  const { id } = await createNewUser(username, publicKey, privateKey);

  if (id) {
    console.log("User created successfully");
  }
}

export async function upload_handler(filePath: string) {}