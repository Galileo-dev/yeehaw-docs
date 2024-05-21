import { treaty } from "@elysiajs/eden";
import chalk from "chalk";
import type { App } from "../../backend/src";
import {
  decryptPrivateKey,
  encryptPrivateKey,
  generateKeyPair,
} from "./crypto";
import { addUser, deleteUser, getUser, getUsers } from "./db";

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
  const encryptedPrivateKey = await encryptPrivateKey(privateKey, password);

  // create the user on the server
  const { data, error } = await app.register.post({
    username,
    password,
    public_key: publicKey,
    encrypted_private_key: encryptedPrivateKey,
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

export async function loginHandler(username: string, password: string) {
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

  // get user from server
  const { data: user, error } = await app.user({ username }).get();

  if (error) {
    switch (error.status) {
      case 400:
        throw error.value;

      default:
        throw error.value;
    }
  }

  if (!user) {
    throw new Error("User not found");
  }

  const privateKey = await decryptPrivateKey(
    password,
    Buffer.from(user.encrypted_private_key, "base64").toString("base64")
  );

  if (!privateKey) {
    throw new Error("Incorrect password");
  }

  if (await addUser(username, user.public_key, privateKey)) {
    console.log("User logged in successfully");
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

export async function usersHandler() {
  const { data, error } = await app.users.get();
  if (error) {
    switch (error.status) {
      case 400:
        throw error.value;

      default:
        throw error.value;
    }
  }

  // pretty print the users
  console.log(chalk.green.bold("Current Users:"));
  data.forEach((user: string) => {
    console.log(chalk.whiteBright("• " + user));
  });

  console.log(chalk.green.bold("Local Users:"));
  const users = await getUsers();
  if (users.length === 0) {
    console.log(chalk.redBright("• No local users"));
    return;
  }
  users.forEach((user) => {
    console.log(chalk.whiteBright("• " + user.username));
  });
}

export async function checkUsernameAvailability(username: string) {
  const user = await getUser(username);
  return !user;
}
