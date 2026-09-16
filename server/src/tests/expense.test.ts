import request from "supertest";
import app from "../app";

const registerUser = async (
  name: string,
  email: string,
  password = "password123",
) => {
  const response = await request(app).post("/api/auth/register").send({
    name,
    email,
    password,
  });

  expect(response.status).toBe(201);

  return response.body as {
    id: string;
    name: string;
    email: string;
    token: string;
  };
};

describe("Expense API", () => {
  describe("POST /api/expenses", () => {
    it("records the authenticated user as payer and ignores client-provided paidBy", async () => {
      const alice = await registerUser("Alice", "alice@example.com");
      const bob = await registerUser("Bob", "bob@example.com");

      const createGroupResponse = await request(app)
        .post("/api/groups")
        .set("Authorization", `Bearer ${alice.token}`)
        .send({ name: "Weekend trip" });

      expect(createGroupResponse.status).toBe(201);

      const groupId = createGroupResponse.body._id;

      const addMemberResponse = await request(app)
        .post(`/api/groups/${groupId}/members`)
        .set("Authorization", `Bearer ${alice.token}`)
        .send({ email: bob.email });

      expect(addMemberResponse.status).toBe(200);

      const createExpenseResponse = await request(app)
        .post("/api/expenses")
        .set("Authorization", `Bearer ${bob.token}`)
        .send({
          groupId,
          description: "Dinner",
          amount: 10000,
          paidBy: alice.id,
        });

      expect(createExpenseResponse.status).toBe(201);
      expect(createExpenseResponse.body.paidBy._id).toBe(bob.id);
      expect(createExpenseResponse.body.paidBy._id).not.toBe(alice.id);
    });
  });
});
