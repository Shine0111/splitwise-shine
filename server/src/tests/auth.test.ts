import request from "supertest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import app from "../app";
import User from "../models/User";
import Session from "../models/Session";

describe("Authentication API", () => {
  describe("POST /api/auth/register", () => {
    it("registers a user, hashes the password, and returns a token", async () => {
      const response = await request(app).post("/api/auth/register").send({
        name: "Alice",
        email: "alice@example.com",
        password: "password123",
      });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(
        expect.objectContaining({
          name: "Alice",
          email: "alice@example.com",
          token: expect.any(String),
        }),
      );
      expect(response.body.id).toEqual(expect.any(String));
      expect(response.body).not.toHaveProperty("password");

      const user = await User.findOne({ email: "alice@example.com" }).select(
        "+password",
      );

      expect(user).not.toBeNull();
      expect(user?.password).not.toBe("password123");
      await expect(bcrypt.compare("password123", user!.password)).resolves.toBe(
        true,
      );
    });

    it("rejects missing required fields", async () => {
      const response = await request(app).post("/api/auth/register").send({
        name: "Alice",
        email: "alice@example.com",
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: "All fields are required",
      });
    });

    it("rejects non-string registration values", async () => {
      const response = await request(app).post("/api/auth/register").send({
        name: "Alice",
        email: "alice@example.com",
        password: 123456,
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: "All fields are required",
      });
    });

    it("rejects passwords shorter than six characters", async () => {
      const response = await request(app).post("/api/auth/register").send({
        name: "Alice",
        email: "alice@example.com",
        password: "12345",
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: "Password must be at least 6 characters",
      });
    });

    it("rejects duplicate email addresses", async () => {
      await User.create({
        name: "Existing User",
        email: "alice@example.com",
        password: await bcrypt.hash("password123", 10),
      });

      const response = await request(app).post("/api/auth/register").send({
        name: "Alice",
        email: "alice@example.com",
        password: "password123",
      });

      expect(response.status).toBe(409);
      expect(response.body).toEqual({
        message: "Email already in use",
      });
    });
    it("creates a session when registering a user", async () => {
      const response = await request(app).post("/api/auth/register").send({
        name: "Alice",
        email: "alice@example.com",
        password: "password123",
      });

      expect(response.status).toBe(201);

      const decoded = jwt.decode(response.body.token) as {
        id: string;
        jti?: string;
        exp?: number;
      };

      const session = await Session.findOne({ jti: decoded.jti });

      expect(session).not.toBeNull();
      expect(session?.user.toString()).toBe(decoded.id);
      expect(session?.expiresAt.getTime()).toBe(decoded.exp! * 1000);
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      await User.create({
        name: "Alice",
        email: "alice@example.com",
        password: await bcrypt.hash("password123", 10),
      });
    });

    it("logs in with valid credentials", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "alice@example.com",
        password: "password123",
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          name: "Alice",
          email: "alice@example.com",
          token: expect.any(String),
        }),
      );
      expect(response.body.id).toEqual(expect.any(String));
      expect(response.body).not.toHaveProperty("password");
    });

    it("rejects missing credentials", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "alice@example.com",
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: "Email and password are required",
      });
    });

    it("rejects an unknown email", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "unknown@example.com",
        password: "password123",
      });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        message: "Invalid credentials",
      });
    });

    it("rejects an incorrect password", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "alice@example.com",
        password: "wrong-password",
      });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        message: "Invalid credentials",
      });
    });
  });

  describe("GET /api/auth/me", () => {
    it("returns the authenticated user without the password", async () => {
      const user = await User.create({
        name: "Alice",
        email: "alice@example.com",
        password: await bcrypt.hash("password123", 10),
      });

      const loginResponse = await request(app).post("/api/auth/login").send({
        email: "alice@example.com",
        password: "password123",
      });
      expect(loginResponse.status).toBe(200);

      const token = loginResponse.body.token as string;

      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.user).toEqual(
        expect.objectContaining({
          _id: user._id.toString(),
          name: "Alice",
          email: "alice@example.com",
        }),
      );
      expect(response.body.user).not.toHaveProperty("password");
    });

    it("rejects requests without a bearer token", async () => {
      const response = await request(app).get("/api/auth/me");

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        message: "Not authorized, no token",
      });
    });

    it("rejects malformed tokens", async () => {
      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer invalid-token");

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        message: "Not authorized, token failed",
      });
    });

    it("rejects tokens for deleted users", async () => {
      const user = await User.create({
        name: "Alice",
        email: "alice@example.com",
        password: await bcrypt.hash("password123", 10),
      });

      const loginResponse = await request(app).post("/api/auth/login").send({
        email: "alice@example.com",
        password: "password123",
      });

      expect(loginResponse.status).toBe(200);

      const token = loginResponse.body.token as string;

      await User.deleteOne({ _id: user._id });

      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        message: "Not authorized, user not found",
      });
    });

    it("rejects tokens with an unknown signing secret", async () => {
      const user = await User.create({
        name: "Alice",
        email: "alice@example.com",
        password: await bcrypt.hash("password123", 10),
      });

      const token = jwt.sign({ id: user._id.toString() }, "wrong-secret");

      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        message: "Not authorized, token failed",
      });
    });

    it("rejects an expired token", async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const token = jwt.sign({ id: userId }, process.env.JWT_SECRET!, {
        expiresIn: "-1s",
      });

      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        message: "Not authorized, token failed",
      });
    });
    it("returns a server error when JWT_SECRET is missing", async () => {
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      try {
        const response = await request(app)
          .get("/api/auth/me")
          .set("Authorization", "Bearer any-token");

        expect(response.status).toBe(500);
        expect(response.body).toEqual({
          message: "Server error",
        });
      } finally {
        process.env.JWT_SECRET = originalSecret;
      }
    });
    it("rejects tokens without a session identifier", async () => {
      const user = await User.create({
        name: "Alice",
        email: "alice@example.com",
        password: await bcrypt.hash("password123", 10),
      });

      const token = jwt.sign(
        { id: user._id.toString() },
        process.env.JWT_SECRET!,
      );

      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        message: "Not authorized, session required",
      });
    });
  });
  describe("POST /api/auth/logout", () => {
    const createUser = async () => {
      await User.create({
        name: "Alice",
        email: "alice@example.com",
        password: await bcrypt.hash("password123", 10),
      });
    };

    const login = async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "alice@example.com",
        password: "password123",
      });

      expect(response.status).toBe(200);
      return response.body.token as string;
    };

    it("rejects logout without a bearer token", async () => {
      const response = await request(app).post("/api/auth/logout");

      expect(response.status).toBe(401);
    });

    it("issues a token and creates a matching session", async () => {
      await createUser();

      const token = await login();
      const decoded = jwt.decode(token) as {
        id: string;
        jti?: string;
        exp?: number;
      };

      expect(decoded.jti).toEqual(expect.any(String));
      expect(decoded.exp).toEqual(expect.any(Number));

      const session = await Session.findOne({ jti: decoded.jti });

      expect(session).not.toBeNull();
      expect(session?.user.toString()).toBe(decoded.id);
      expect(session?.revokedAt).toBeUndefined();
      expect(session?.expiresAt.getTime()).toBe(decoded.exp! * 1000);
    });

    it("revokes the current session", async () => {
      await createUser();

      const token = await login();

      const logoutResponse = await request(app)
        .post("/api/auth/logout")
        .set("Authorization", `Bearer ${token}`);

      expect(logoutResponse.status).toBe(200);

      const meResponse = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);

      expect(meResponse.body).toEqual({
        message: "Not authorized, session revoked",
      });

      expect(meResponse.status).toBe(401);
    });

    it("revokes only the current session", async () => {
      await createUser();

      const firstToken = await login();
      const secondToken = await login();

      const logoutResponse = await request(app)
        .post("/api/auth/logout")
        .set("Authorization", `Bearer ${firstToken}`);

      expect(logoutResponse.status).toBe(200);

      const firstMeResponse = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${firstToken}`);

      expect(firstMeResponse.status).toBe(401);

      const secondMeResponse = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${secondToken}`);

      expect(secondMeResponse.status).toBe(200);
    });
    it("rejects repeated logout with an already revoked token", async () => {
      await createUser();

      const token = await login();

      const firstLogoutResponse = await request(app)
        .post("/api/auth/logout")
        .set("Authorization", `Bearer ${token}`);

      expect(firstLogoutResponse.status).toBe(200);

      const secondLogoutResponse = await request(app)
        .post("/api/auth/logout")
        .set("Authorization", `Bearer ${token}`);

      expect(secondLogoutResponse.status).toBe(401);
      expect(secondLogoutResponse.body).toEqual({
        message: "Not authorized, session revoked",
      });
    });
  });
});
