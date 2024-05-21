import { AuthService } from "../src/services/authService";

export const registerTestUser = async (
  authService: AuthService,
  username?: string,
  password?: string,
  public_key?: string,
  encrypted_private_key?: Buffer
) => {
  const testUser = {
    username: username || "testuser",
    password: password || "Password123!",
    public_key: public_key || "publickey123",
    encrypted_private_key:
      encrypted_private_key || Buffer.from([1, 2, 3, 4, 5, 6, 7, 8]),
  };

  return await authService.register(
    testUser.username,
    testUser.password,
    testUser.public_key,
    testUser.encrypted_private_key.toString("base64")
  );
};
