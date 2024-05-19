import { treaty } from "@elysiajs/eden";
import { createReadStream } from "fs";
import FormData from "form-data";
import axios from "axios";
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

export async function upload_handler(filePath: string, recipient: string) {
  const form = new FormData();
  form.append('file', createReadStream(filePath));
  form.append('fromUsername', 'rob');  
  form.append('toUsername', recipient);

  try {
    const response = await axios.post('http://localhost:3001/upload', form, {
      headers: form.getHeaders(),
    });

    if (response.status === 200) {
      console.log("File uploaded successfully");
    } else {
      console.error(`Failed to upload file: ${response.status} ${response.statusText}`);
      console.error(response.data);
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`Error uploading file: ${error.message}`);
      if (error.response) {
        console.error(`Response data: ${JSON.stringify(error.response.data)}`);
      }
    } else {
      console.error("Unexpected error:", error);
    }
  }
}