export class ApiService {
  private endpoint: string;
  private fetch: any;

  constructor(endpoint: string, fetch: any) {
    this.endpoint = endpoint;
    this.fetch = fetch;
  }

  async registerRequest(username: string, publicKey: string) {
    try {
      await this.fetch(`${this.endpoint}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          publicKey,
        }),
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
