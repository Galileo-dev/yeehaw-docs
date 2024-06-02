import { treaty } from "@elysiajs/eden";
import type { App } from "../../backend/src";
import { getJwtToken } from "./db";
import { formatValidationErrors } from "./error";

const jwtToken = await getJwtToken();

const headers: Record<string, string> = jwtToken ? { cookie: jwtToken } : {};

const app = treaty<App>("localhost:3001", {
  headers,
});

export async function getUserPublicKey(username: string) {
  const { data, error } = await app.user({ username }).get();

  if (error)
    switch (error.status) {
      case 422:
        throw formatValidationErrors(error.value);

      default:
        throw error.value;
    }

  if (!data) throw new Error("User not found");

  return data.publicKey;
}

export async function getFile(id: number) {
  const { data, error } = await app.download({ id }).get();

  if (error) {
    switch (error.status) {
      case 422:
        throw formatValidationErrors(error.value);
      default:
        throw error.value;
    }
  }

  if (!data) {
    throw new Error("File not found");
  }

  return data;
}
