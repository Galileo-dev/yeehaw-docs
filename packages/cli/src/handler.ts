import { treaty } from "@elysiajs/eden";
import chalk from "chalk";
import * as crypto from "crypto";
import type { App } from "../../backend/src";
import {
  decryptPrivateKey,
  encryptData,
  encryptPrivateKey,
  encryptSymmetricKey,
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
    publicKey,
    encryptedPrivateKey,
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
    user.encryptedPrivateKey
  );

  if (!privateKey) {
    throw new Error("Incorrect password");
  }

  if (await addUser(username, user.publicKey, privateKey)) {
    console.log("User logged in successfully");
  }
}

export async function uploadHandler(
  filePath: string,
  recipient: string,
  sender: string
) {
  // get the sender's private key from the local db
  const user = await getUser(sender);
  if (!user) {
    throw new Error("Sender not found, please login first");
  }

  const senderPrivateKey = user.privateKey;

  // retrieve the recipient's public key
  const recipientPublicKey = await getUserPublicKey(recipient);

  const bunFile = await Bun.file(filePath); // needs to be converted to a file object for elysia to accept it
  const fileBuffer = await bunFile.arrayBuffer();
  const fileName = bunFile.name;
  if (!fileName) {
    throw new Error("File name is not valid");
  }

  const symmetricKey = await crypto.randomBytes(32); // 32 bytes = 256 bits for AES-256

  const fileBufferNode = await Buffer.from(fileBuffer);

  // Encrypt the file using the symmetric key
  const { encryptedData, iv, authTag } = encryptData(
    fileBufferNode,
    symmetricKey
  );

  // Encrypt the symmetric key using the recipient's public key so only they can decrypt it
  const encryptedSymmetricKey = encryptSymmetricKey(
    symmetricKey,
    recipientPublicKey
  );

  // Create a digital signature of the file using the sender's private key
  const sign = crypto.createSign("SHA256");
  sign.update(encryptedData);
  sign.end();
  const signature = sign.sign(senderPrivateKey);

  // we need to bundle into a file object for elysia to accept it

  const { data, error } = await app.upload.post({
    fromUsername: sender,
    toUsername: recipient,
    file: {
      name: fileName,
      size: fileBufferNode.length,
      data: encryptedData.toString("base64"),
      iv: iv.toString("base64"),
      salt: symmetricKey.toString("base64"),
      authTag: authTag.toString("base64"),
      signature: signature.toString("base64"),
    },
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

export async function checkHandler(username: string) {
  const { data, error } = await app.files.shared({ username }).get();

  if (error) {
    switch (error.status) {
      case 400:
        throw error.value;

      default:
        throw error.value;
    }
  }

  if (!data) {
    throw new Error("User not found");
  }

  console.log(chalk.green.bold(`Files available for ${username}:`));
  data.forEach((file) => {
    console.log(
      chalk.whiteBright(
        `• ${file.name} (${file.size}B) from ${file.fromUsername}`
      )
    );
  });
}

export async function checkUsernameAvailability(username: string) {
  const user = await getUser(username);
  return !user;
}

export async function getUserPublicKey(username: string) {
  const { data, error } = await app.user({ username }).get();

  if (error) {
    switch (error.status) {
      case 400:
        throw error.value;

      default:
        throw error.value;
    }
  }

  if (!data) {
    throw new Error("User not found");
  }

  return data.publicKey;
}
