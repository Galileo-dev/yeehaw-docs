import { treaty } from "@elysiajs/eden";
import chalk from "chalk";
import * as crypto from "crypto";
import * as path from "path";
import type { App } from "../../backend/src";
import {
  decryptData,
  decryptPrivateKey,
  decryptSymmetricKey,
  encryptData,
  encryptPrivateKey,
  encryptSymmetricKey,
  generateKeyPair,
  signData,
  verifySignature,
} from "./crypto";
import { addUser, deleteUser, getUser, getUsers } from "./db";
import { formatValidationErrors } from "./error";
import { getFile, getUserPublicKey } from "./server";

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
      case 422:
        throw formatValidationErrors(error.value);
      default:
        throw error.value;
    }
  }

  if (await addUser(username, publicKey, privateKey, password)) {
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
      case 422:
        throw formatValidationErrors(error.value);
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

  if (await addUser(username, user.publicKey, privateKey, password)) {
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
  if (!bunFile.name) {
    throw new Error("File name is not valid");
  }

  const fileName = path.basename(bunFile.name);

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
  const signature = signData(fileBufferNode, senderPrivateKey);

  // we need to bundle into a file object for elysia to accept it

  const { data, error } = await app.upload.post({
    fromUsername: sender,
    toUsername: recipient,
    file: {
      name: fileName,
      size: fileBufferNode.length,
      data: encryptedData.toString("base64"),
      iv: iv.toString("base64"),
      authTag: authTag.toString("base64"),
      encryptedSymmetricKey: encryptedSymmetricKey.toString("base64"),
      signature: signature.toString("base64"),
    },
  });

  if (error) {
    switch (error.status) {
      case 422:
        throw formatValidationErrors(error.value);

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
      case 422:
        throw formatValidationErrors(error.value);

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
      case 422:
        throw formatValidationErrors(error.value);

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
        `${file.id} : ${file.name} (${file.size}B) from ${file.fromUsername}`
      )
    );
  });
}

export async function checkUsernameAvailability(username: string) {
  const user = await getUser(username);
  return !user;
}

export async function downloadHandler(fileId: number, recipient: string) {
  // get the recipient's private key from the local db
  const user = await getUser(recipient);
  if (!user) {
    throw new Error("Recipient not found");
  }

  const recipientPrivateKey = user.privateKey;

  // get the file from the server
  const {
    file: {
      name,
      iv,
      authTag,
      encryptedSymmetricKey,
      signature,
      data: encryptedData,
    },
    fromUsername,
  } = await getFile(fileId);

  // decrypt the symmetric key used to encrypt the file
  const decryptedSymmetricKey = decryptSymmetricKey(
    Buffer.from(encryptedSymmetricKey, "base64"),
    recipientPrivateKey
  );

  const senderPublicKey = await getUserPublicKey(fromUsername);

  console.log(senderPublicKey);

  // Verify the signature of the file using the sender's public key
  const signatureBuffer = Buffer.from(signature, "base64");
  const verified = verifySignature(
    Buffer.from(encryptedData, "base64"),
    signatureBuffer,
    senderPublicKey
  );

  if (!verified) {
    throw new Error("File signature is invalid");
  }

  // Decrypt the file using the symmetric key
  const decryptedData = decryptData(
    Buffer.from(encryptedData, "base64"),
    decryptedSymmetricKey,
    Buffer.from(iv, "base64"),
    Buffer.from(authTag, "base64")
  );

  const file = new File([decryptedData], name);

  Bun.write(name, file);
  console.log("File downloaded successfully");
}
