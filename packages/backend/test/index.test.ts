// test/index.test.ts
import { beforeEach, describe, expect, it } from "bun:test";
import { app } from "../src/app";
import { FileDB } from "../src/db/fileDB";
import { UserDB } from "../src/db/userDB";

let userDB: UserDB;
let fileDB: FileDB;

describe("Yeehaw Docs E2E", () => {
  beforeEach(() => {
    userDB = new UserDB(":memory:");
    fileDB = new FileDB(":memory:");
  });

  it("should return the correct welcome message with version", async () => {
    const response = await app(userDB, fileDB)
      .handle(
        new Request("http://localhost:3000/", {
          method: "GET",
        })
      )
      .then((res: Response) => res);

    // should half match the response as the version is undefined in test
    expect(await response.text()).toMatch(
      "Hello, Welcome to the super secure file server\n\n"
    );
  });
});
