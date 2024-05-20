import { t } from "elysia";

export const UsernameModel = t.String({
  minLength: 3,
  maxLength: 20,
  default: "john_doe",
  pattern: "^[a-zA-Z0-9_]*$",
  description:
    "A username must be between 3 and 20 characters long and can only contain letters, numbers, and underscores",
});

export const PasswordModel = t.String({
  minLength: 8,
  default: "Password123!",
  pattern: "^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$",
  description:
    "A password must have minimum eight characters, at least one uppercase letter, one lowercase letter, one number and one special character",
});

export const PublicKeyModel = t.String({
  default: `-----BEGIN PUBLIC KEY-----
MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAKj34GkxFhD90vcNLYLInFEX6Ppy1tPf
9Cnzj4p4WGeKLs1Pt8QuKUpRKfFLfRYC9AIKjbJTWit+CqvjWYzvQwECAwEAAQ==
-----END PUBLIC KEY-----`,
  pattern: "/-----BEGIN PUBLIC KEY-----(.*)-----END PUBLIC KEY-----/s",
});
