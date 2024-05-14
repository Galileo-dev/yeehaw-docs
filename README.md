# Yeehaw-docs Monorepo

### Overview

yeehaw-docs is a simple secure file management system. It supports end-to-end encryption and is built to support multiple users.

### Usage

To run your own instance of the yeehaw-docs backend, clone this repo and run the following commands:

```bash
cd packages/backend
bun install
bun start
```

To run the CLI, run the following commands:

```bash
cd packages/cli
bun install
bun start
```

### File Structure

```
.
├── bun.lockb
├── index.ts
├── package.json
├── packages
│   ├── backend
│   │   ├── file.db
│   │   ├── models.ts
│   │   ├── package.json
│   │   ├── README.md
│   │   ├── src
│   │   ├── tsconfig.json
│   │   └── user.db
│   ├── cli
│   │   ├── index.ts
│   │   └── package.json
│   └── common
│       ├── index.d.ts
│       └── package.json
├── README.md
└── tsconfig.json
```

This project was created using `bun init` in bun v1.1.7. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
