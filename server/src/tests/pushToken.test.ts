import request from "supertest";
import app from "../app";
import DevicePushToken from "../models/DevicePushToken";

const registerUser = async () => {
  const response = await request(app).post("/api/auth/register").send({
    name: "Alice",
    email: "alice@example.com",
    password: "password123",
  });

  expect(response.status).toBe(201);

  return response.body as {
    id: string;
    token: string;
  };
};

describe("Push token API", () => {
  describe("POST /api/push-tokens", () => {
    it("registers an Expo push token for the authenticated user", async () => {
      const user = await registerUser();

      const response = await request(app)
        .post("/api/push-tokens")
        .set("Authorization", `Bearer ${user.token}`)
        .send({
          expoPushToken: "ExponentPushToken[test-token]",
          platform: "android",
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: "Push token registered",
      });

      const storedToken = await DevicePushToken.findOne({
        expoPushToken: "ExponentPushToken[test-token]",
      });

      expect(storedToken).not.toBeNull();
      expect(storedToken?.user.toString()).toBe(user.id);
      expect(storedToken?.platform).toBe("android");
      expect(storedToken?.enabled).toBe(true);
    });

    it("rejects a request without authentication", async () => {
      const response = await request(app).post("/api/push-tokens").send({
        expoPushToken: "ExponentPushToken[test-token]",
        platform: "android",
      });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        message: "Not authorized, no token",
      });
    });

    it("rejects an invalid platform", async () => {
      const user = await registerUser();

      const response = await request(app)
        .post("/api/push-tokens")
        .set("Authorization", `Bearer ${user.token}`)
        .send({
          expoPushToken: "ExponentPushToken[test-token]",
          platform: "web",
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: "expoPushToken and a valid platform are required",
      });
    });
  });
});
