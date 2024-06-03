import jwt from "@elysiajs/jwt";
import { AuthService } from "../src/services/authService";

export const registerTestUser = async (
  authService: AuthService,
  username?: string,
  password?: string,
  public_key?: string,
  encryptedPrivateKey?: Buffer
) => {
  const testUser = {
    username: username || "testuser",
    password: password || "Password123!",
    public_key: public_key || "publickey123",
    encryptedPrivateKey: {
      iv: "iv",
      salt: "salt",
      data: "data",
      authTag: "authTag",
    },
  };

  return await authService.register(
    testUser.username,
    testUser.password,
    testUser.public_key,
    testUser.encryptedPrivateKey
  );
};

export const getJWT = async (authService: AuthService, username: string) => {
  const user = await authService.getUser(username);

  if (!user) {
    throw new Error("User not found");
  }

  const jwtToken = await jwt({
    name: "jwt",
    secret: process.env.JWT_SECRET!,
  }).decorator.jwt.sign({ id: user.id! });

  const headers: Record<string, string> = jwtToken
    ? { cookie: `auth=${jwtToken}` }
    : {};

  return headers;
};
