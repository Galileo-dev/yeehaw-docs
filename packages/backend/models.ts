import { t } from "elysia";

export const UsernameModel = t.String({
  minLength: 3,
  maxLength: 20,
  default: "john_doe",
  description:
    "A username must be between 3 and 20 characters long and can only contain letters, numbers, and underscores",
});

export const PublicKeyModel = t.String({
  default: `-----BEGIN PUBLIC KEY-----
MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAKj34GkxFhD90vcNLYLInFEX6Ppy1tPf
9Cnzj4p4WGeKLs1Pt8QuKUpRKfFLfRYC9AIKjbJTWit+CqvjWYzvQwECAwEAAQ==
-----END PUBLIC KEY-----`,
  pattern: "/-----BEGIN PUBLIC KEY-----(.*)-----END PUBLIC KEY-----/s",
});

//Add password model here