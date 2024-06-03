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

by default the CLI will connect to the backend at `https://yeehawdocs.glynny.org/` to use localhost set the `DEV` environment variable to `true`.
on mac/linux `DEV=true yeehaw`
on windows (powershell) `$env:DEV="true"; yeehaw`

This project was created using `bun init` in bun v1.1.7. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
