import request from "supertest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import app from "../app";
import User from "../models/User";

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

      const token = jwt.sign(
        { id: user._id.toString() },
        process.env.JWT_SECRET!,
      );

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

      const token = jwt.sign(
        { id: user._id.toString() },
        process.env.JWT_SECRET!,
      );

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
  });
});
