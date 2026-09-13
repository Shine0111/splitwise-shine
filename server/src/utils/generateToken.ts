import { randomUUID } from "crypto";
import jwt from "jsonwebtoken";

const TOKEN_LIFETIME_SECONDS = 30 * 24 * 60 * 60;

interface GeneratedToken {
  token: string;
  jti: string;
  expiresAt: Date;
}

const generateToken = (userId: string): GeneratedToken => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }

  const jti = randomUUID();
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAtSeconds = issuedAt + TOKEN_LIFETIME_SECONDS;

  const token = jwt.sign(
    {
      id: userId,
      jti,
      iat: issuedAt,
      exp: expiresAtSeconds,
    },
    secret,
  );

  return {
    token,
    jti,
    expiresAt: new Date(expiresAtSeconds * 1000),
  };
};

export default generateToken;
