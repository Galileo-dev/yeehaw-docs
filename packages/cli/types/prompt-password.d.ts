declare module 'prompt-password' {
    export default class PromptPassword {
      constructor(options: { type: string, message: string, name: string });
      run(): Promise<string>;
    }
  }