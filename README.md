# Yeehaw-docs Monorepo

### Overview

yeehaw-docs is a simple secure file management system. It supports end-to-end encryption and is built to support multiple users.

### Usage

To run your own instance of the yeehaw-docs backend, clone this repo and run the following commands:

```bash
cd packages/backend
bun install
bun dev
```

To run the CLI, run the following commands:

```bash
cd packages/cli
bun install
bun link
bun link @yeehaw-docs/cli
yeehaw
```

### Troubleshooting

- If you get an error about the workspace when running `bun link @yeehaw-docs/cli`, you can ignore it and proceed with the next command.

- If you encounter any issues with the installation, try to delete the `bun.lockb` and reinstall

by default the CLI will connect to the backend at `https://yeehawdocs.glynny.org/`. To use localhost set the `DEV` environment variable to `true`.

- on mac/linux run `DEV=true yeehaw`
- on windows(powershell) run `$env:DEV="true"; yeehaw`

This project was created using `bun init` in bun v1.1.7. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
