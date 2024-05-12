import { generateKeyPairSync } from "crypto";
import { writeFileSync } from "fs";
import { ApiService } from "./api";

export class AuthService {
  apiService: ApiService;

  constructor(apiService: ApiService) {
    this.apiService = apiService;
  }
  /*
   * Create a new user and upload their public key
   */
  async register(
    username: string,
    passphrase?: string,
    publicKeyPath: string = "public.pem",
    privateKeyPath: string = "private.pem"
  ) {
    const { publicKey, privateKey } = this.generateKeyPair(passphrase);

    this.savePublicKey(publicKeyPath, publicKey);

    await this.apiService.registerRequest(username, publicKey);
  }

  /*
   * Generate a key pair with or without a passphrase
   */
  generateKeyPair(passphrase?: string) {
    const { publicKey, privateKey } = generateKeyPairSync("rsa", {
      modulusLength: 4096,
      publicKeyEncoding: {
        type: "spki",
        format: "pem",
      },
      privateKeyEncoding: {
        type: "pkcs8",
        format: "pem",
        passphrase,
      },
    });

    return {
      publicKey,
      privateKey,
    };
  }

  savePublicKey(path: string, publicKey: string) {
    writeFileSync(path, publicKey);
  }
}
