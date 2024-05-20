import { AuthService } from "../src/services/authService";

export const registerTestUser = async (
  authService: AuthService,
  username?: string,
  password?: string,
  public_key?: string,
  encrypted_private_key?: Buffer,
  salt?: Buffer,
  iv?: Buffer,
  auth_tag?: Buffer
) => {
  const testUser = {
    username: username || "testuser",
    password: password || "Password123!",
    public_key: public_key || "publickey123",
    encrypted_private_key:
      encrypted_private_key || Buffer.from([1, 2, 3, 4, 5, 6, 7, 8]),
    salt: salt || Buffer.from([9, 10, 11, 12, 13, 14, 15, 16]),
    iv: iv || Buffer.from([17, 18, 19, 20, 21, 22, 23, 24]),
    auth_tag: auth_tag || Buffer.from([25, 26, 27, 28, 29, 30, 31, 32]),
  };

  return await authService.register(
    testUser.username,
    testUser.password,
    testUser.public_key,
    testUser.encrypted_private_key,
    testUser.salt,
    testUser.iv,
    testUser.auth_tag
  );
};
