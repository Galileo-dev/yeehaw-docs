import { treaty } from "@elysiajs/eden";
import password from "@inquirer/password";
import chalk from "chalk";
import * as crypto from "crypto";
import * as fs from "fs";
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
const server_url = process.env.DEV
  ? "localhost:3001"
  : "https://yeehawdocs.glynny.org/script/";
const app = treaty<App>(server_url, {
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
        `This town's only big enough for one ${username}. ${username} already exists locally. You reckon you're fixin' to overwrite the old wrangler and risk losin' access to their files?`
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
    throw new Error(
      "Well, I'll be darned! Ain't no headers makin' its way over from the server"
    );
  }

  const jwtToken = getHeaderValue(headers, "set-cookie");

  if (!jwtToken) {
    throw new Error(
      "Well, I'll be darned! Ain't no JWT token makin' its way over from the server"
    );
  }

  if (await addUser(username, publicKey, encryptedPrivateKey, jwtToken)) {
    setActiveUser(username);
    console.log(
      "Yahoooo!! We've got ourselves a new cowpoke in town! Saddle up and ride on, cowboy!"
    );
  }
}

export async function loginHandler(
  username: string,
  authPassword: string,
  masterPassword: string
) {
  try {
    if (!(await checkUsernameAvailability(username))) {
      if (
        !(await confirm(
          `This town's only big enough for one ${username}. ${username} already exists locally. You reckon you're fixin' to overwrite the old wrangler and risk losin' access to their files?`
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
      throw new Error(
        "Ain't no cowboy in these parts with that handle. You mighty sure ya got the right feller?"
      );
    }

    if (!headers) {
      throw new Error(
        "Well, I'll be darned! Ain't no headers makin' its way over from the server"
      );
    }

    const jwtToken = getHeaderValue(headers, "set-cookie");

    if (!jwtToken) {
      throw new Error(
        "Well, I'll be darned! Ain't no JWT token makin' its way over from the server"
      );
    }

    const privateKey = await (async () => {
      try {
        return await decryptPrivateKey(masterPassword, user.encryptedPrivateKey);
      } catch (e) {
        throw new Error(
          "Hold your horses, cowboy! That there master password ain't quite right. Try again, partner"
        );
      }
    })();

    if (!privateKey) {
      throw new Error(
        "Hold your horses, cowboy! That there master password ain't quite right. Try again, partner"
      );
    }

    if (
      await addUser(username, user.publicKey, user.encryptedPrivateKey, jwtToken)
    ) {
      setActiveUser(username);
      console.log("Welcome cowboy!");
    }
  } catch (error) {
    console.error((error as Error).message);
  }
}

export async function logoutHandler(username: string) {
  await deleteUser(username);
  console.log(
    "Well, you've kicked off them boots and hung up your hat like a true cowboy. Until next time, partner"
  );
}

export async function switchUserHandler(username: string) {
  const user = await getUser(username);
  if (!user) {
    throw new Error(
      "Ain't no cowboy in these parts with that handle. You mighty sure ya got the right feller?"
    );
  }

  setActiveUser(username);
  console.log(
    "Well, look at you, swappin' saddles like a seasoned rider. All set in your new spot, partner?"
  );
}

export async function uploadHandler(
  filePath: string,
  recipient: string
) {

  // retrieve the recipient's public key
  const recipientPublicKey = await getUserPublicKey(recipient);

  const bunFile = Bun.file(filePath); // needs to be converted to a file object for elysia to accept it

  if (bunFile.size > 10485760) { // 10MB
    throw new Error(
      "Hold your horses, cowboy. That file's too big for the saddle. You'll need to rustle up a smaller one, partner"
    );
  }

  const fileBuffer = await bunFile.arrayBuffer();
  if (!bunFile.name) {
    throw new Error(
      "Hold your horses, cowboy. Seems like that file name ain't quite cuttin' the mustard. Better rustle up a proper one, partner"
    );
  }

  const fileName = path.basename(bunFile.name);

  const symmetricKey = crypto.randomBytes(32); // 32 bytes = 256 bits for AES-256

  const fileBufferNode = Buffer.from(fileBuffer);

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

  const { error } = await app.upload.post({
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

  console.log(
    "That there file's been sent well on its way. Nicely done, partner"
  );
}

export async function usersHandler() {
  // pretty print the users
  console.log(chalk.green.bold("Users:"));
  const users = await getUsers();

  const activeUser = await getActiveUser();

  if (users.length === 0) {
    console.log(
      chalk.redBright(
        "Looks like the town's deserted, partner. Time to strap on your spurs and register or login."
      )
    );
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
    throw new Error(
      "Well, ain't that a kick in the stirrups? Seems we done failed to wrangle them files"
    );
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
  try {
    // get the recipient's private key from the local db
    const user = await getActiveUser();
    if (!user) {
      throw new Error(
        "Unable to download that file for ya partner"
      );
    }

    const masterPassword = await password({
      message: "Mind sharin' your master password?",
    });

    const recipientPrivateKey = await (async () => {
      try {
        return await decryptPrivateKey(masterPassword, user.encryptedPrivateKey);
      } catch (e) {
        throw new Error(
          "Hold your horses, cowboy! That there master password ain't quite right"
        );
      }
    })();

    // get the file from the server
    const {
      file: { name, iv, authTag, encryptedSymmetricKey, data: encryptedData },
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

    // check if filename exists in the specified directory
    if (fs.existsSync(filePath)) {
      const overwrite = await confirm(
        `Seems to me this here file, ${name}, done already pitched its tent in ${location}. You fixin' to overwrite it?`
      );
      if (!overwrite) {
        console.log(
          "Well, reckon it's time to call off this here download. Yesiree, that file won't be moseyin' 'round these parts anytime soon"
        );
        return;
      }
    }

    fs.writeFileSync(filePath, decryptedData);
    console.log(
      "YeeeeeHAW! that there file's been lasooed 'n' wrangled in without a hitch!"
    );
  } catch (error) {
    console.error((error as Error).message); // Print the error message without stack trace
  }
}

export async function purgeHandler() {
  if (
    await confirm(
      "'Scuse me partner - this here action's fixin' to wipe out all your data clean as a whistle. Meanin' you'll be roped into re-registerin' and wrangling with that login again. Are you mighty sure this is what you're after?"
    )
  ) {
    await purgeData();
    console.log(
      "Well, reckon we done cleared them data trails like a tumbleweed in a prairie breeze. All spick and span now, partner!"
    );
  }
}
