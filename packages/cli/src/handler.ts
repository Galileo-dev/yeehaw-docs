import { treaty } from "@elysiajs/eden";
import { generateKeyPairSync } from "crypto";
import type { App } from "../../backend/src";
import { addUser, getUser } from "./db";

const app = treaty<App>("localhost:3001");




export async function signupHandler(username: string, password: string) {

  if(!await checkUsernameAvailability(username)){
    if (!await confirm("Username already exists locally, do you want to overwrite with new user? (you will lose access to the old user's files!)")) {
      return;
    }
  }


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

  // create the user on the server
  const { data, error } = await app.register.post({
    username,
    password,
    public_key: publicKey,
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