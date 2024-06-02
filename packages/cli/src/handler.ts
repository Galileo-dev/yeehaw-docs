import { treaty } from "@elysiajs/eden";
import password from "@inquirer/password";
import chalk from "chalk";
import * as crypto from "crypto";
import * as fs from 'fs';
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
} from "./crypto";
import {
  addUser,
  deleteUser,
  getActiveUser,
  getJwtToken,
  getUser,
  getUsers,
  purgeData,
  setActiveUser,
} from "./db";
import { formatValidationErrors } from "./error";
import { getFile, getUserPublicKey } from "./server";
import { getHeaderValue } from "./utils";

const jwtToken = await getJwtToken();

const headers: Record<string, string> = jwtToken ? { cookie: jwtToken } : {};

const app = treaty<App>("localhost:3001", {
  headers,
});
export async function signupHandler(
  username: string,
  authPassword: string,
  masterPassword: string
) {
  if (!(await checkUsernameAvailability(username))) {
    if (
      !(await confirm(
        "Username already exists locally, do you want to overwrite with new user? (you may lose access to the old user's files!)"
      ))
    ) {
      return;
    }
    await deleteUser(username);
  }

  const { publicKey, privateKey } = await generateKeyPair();

  // encrypt private key with password
  const encryptedPrivateKey = await encryptPrivateKey(
    privateKey,
    masterPassword
  );

  // create the user on the server
  const { data, error, headers } = await app.register.post({
    username,
    password: authPassword,
    publicKey,
    encryptedPrivateKey,
  });

  if (error) {
    switch (error.status) {
      case 422:
        throw formatValidationErrors(error.value);
      case 500:
        throw error.value;
      default:
        throw error.value;
    }
  }

  if (!headers) {
    throw new Error("No headers received from server");
  }

  const jwtToken = getHeaderValue(headers, "set-cookie");

  if (!jwtToken) {
    throw new Error("No JWT token received from server");
  }

  if (await addUser(username, publicKey, encryptedPrivateKey, jwtToken)) {
    setActiveUser(username);
    console.log("User created successfully");
  }
}

export async function loginHandler(
  username: string,
  authPassword: string,
  masterPassword: string
) {
  if (!(await checkUsernameAvailability(username))) {
    if (
      !(await confirm(
        "Username already exists locally, do you want to overwrite with new user? (you may lose access to the old user's files!)"
      ))
    ) {
      return;
    }
    await deleteUser(username);
  }

  // get user from server
  const {
    data: user,
    error,
    headers,
  } = await app.login.post({
    username,
    authPassword,
  });

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

  if (!headers) {
    throw new Error("No headers received from server");
  }

  const jwtToken = getHeaderValue(headers, "set-cookie");

  if (!jwtToken) {
    throw new Error("No JWT token received from server");
  }

  const privateKey = await decryptPrivateKey(
    masterPassword,
    user.encryptedPrivateKey
  );

  if (!privateKey) {
    throw new Error("Incorrect master password");
  }

  if (
    await addUser(username, user.publicKey, user.encryptedPrivateKey, jwtToken)
  ) {
    setActiveUser(username);
    console.log("User logged in successfully");
  }
}

export async function logoutHandler(username: string) {
  await deleteUser(username);
  console.log("User logged out successfully");
}

export async function switchUserHandler(username: string) {
  const user = await getUser(username);
  if (!user) {
    throw new Error("User not found");
  }

  setActiveUser(username);
  console.log("User switched successfully");
}

export async function uploadHandler(
  filePath: string,
  recipient: string,
  masterPassword: string
) {
  // get the sender's private key from the local db
  const sender = await getActiveUser();
  if (!sender) {
    throw new Error("Sender not found, please login first");
  }

  const senderPrivateKey = await decryptPrivateKey(
    masterPassword,
    sender.encryptedPrivateKey
  );

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

  // we need to bundle into a file object for elysia to accept it

  const { data, error } = await app.upload.post({
    fromUsername: sender.username,
    toUsername: recipient,
    file: {
      name: fileName,
      size: fileBufferNode.length,
      data: encryptedData.toString("base64"),
      iv: iv.toString("base64"),
      authTag: authTag.toString("base64"),
      encryptedSymmetricKey: encryptedSymmetricKey.toString("base64"),
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
  // pretty print the users
  console.log(chalk.green.bold("Users:"));
  const users = await getUsers();

  const activeUser = await getActiveUser();

  if (users.length === 0) {
    console.log(chalk.redBright("• No users, please register or login"));
    return;
  }
  users.forEach((user) => {
    if (user.username === activeUser?.username) {
      console.log(chalk.whiteBright(chalk.green("✔ ") + user.username));
      return;
    }

    console.log(chalk.whiteBright("• " + user.username));
  });
}

export async function checkHandler() {
  const { data, error } = await app.files.shared.get();

  if (error) {
    switch (error.status) {
      case 422:
        throw formatValidationErrors(error.value);

      default:
        throw error.value;
    }
  }

  if (!data) {
    throw new Error("Failed to get files");
  }

  console.log(chalk.green.bold(`Files available:`));
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

export async function downloadHandler(fileId: number, location: string) {
  // get the recipient's private key from the local db
  const user = await getActiveUser();
  if (!user) {
    throw new Error("Recipient not found");
  }

  const masterPassword = await password({
    message: "Enter your master password",
  });

  const recipientPrivateKey = await decryptPrivateKey(
    masterPassword,
    user.encryptedPrivateKey
  );

  // get the file from the server
  const {
    file: { name, iv, authTag, encryptedSymmetricKey, data: encryptedData },
    fromUsername,
  } = await getFile(fileId);

  // decrypt the symmetric key used to encrypt the file
  const decryptedSymmetricKey = decryptSymmetricKey(
    Buffer.from(encryptedSymmetricKey, "base64"),
    recipientPrivateKey
  );


  // Decrypt the file using the symmetric key
  const decryptedData = decryptData(
    Buffer.from(encryptedData, "base64"),
    decryptedSymmetricKey,
    Buffer.from(iv, "base64"),
    Buffer.from(authTag, "base64")
  );

  const filePath = path.join(location, name);

  fs.writeFileSync(filePath, decryptedData);
  console.log("File downloaded successfully");
}

export async function purgeHandler() {
  if (
    await confirm(
      "This will delete all data, (you will have to re-register and re-login) are you sure?"
    )
  ) {
    await purgeData();
    console.log("Data purged successfully");
  }
}
