import { treaty } from "@elysiajs/eden";
import type { App } from "../../backend/src";
import { encryptPrivateKey, generateKeyPair } from "./crypto";
import { addUser, deleteUser, getUser } from "./db";

const app = treaty<App>("localhost:3001");

export async function signupHandler(username: string, password: string) {
  if (!(await checkUsernameAvailability(username))) {
    if (
      !(await confirm(
        "Username already exists locally, do you want to overwrite with new user? (you will lose access to the old user's files!)"
      ))
    ) {
      return;
    }
    await deleteUser(username);
  }

  const { publicKey, privateKey } = await generateKeyPair();

  // encrypt private key with password
  const { encryptedPrivateKey, salt, iv, authTag } = await encryptPrivateKey(
    privateKey,
    password
  );

  // create the user on the server
  const { data, error } = await app.register.post({
    username,
    password,
    public_key: publicKey,
    encrypted_private_key: encryptedPrivateKey.toString("base64"),
    salt: salt.toString("base64"),
    iv: iv.toString("base64"),
    auth_tag: authTag.toString("base64"),
  });

  if (error) {
    switch (error.status) {
      case 400:
        throw error.value;

      default:
        throw error.value;
    }
  }

  if (await addUser(username, publicKey, privateKey)) {
    console.log("User created successfully");
  }
}

export async function uploadHandler(
  filePath: string,
  recipient: string,
  sender: string
) {
  const bunFile = await Bun.file(filePath);
  const fileBuffer = await bunFile.arrayBuffer();
  const fileName = bunFile.name;
  if (!fileName) {
    throw new Error("File name is not valid");
  }
  const file = new File([fileBuffer], fileName, { type: bunFile.type });
  const { data, error } = await app.upload.post({
    file,
    fromUsername: sender,
    toUsername: recipient,
  });

  if (error) {
    switch (error.status) {
      case 400:
        throw error.value;

      default:
        throw error.value;
    }
  }

  console.log("File uploaded successfully");
}

export async function checkUsernameAvailability(username: string) {
  const user = await getUser(username);
  return !user;
}
