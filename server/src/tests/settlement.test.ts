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

const createGroupWithMember = async () => {
  const alice = await registerUser("Alice", "alice@example.com");
  const bob = await registerUser("Bob", "bob@example.com");

  const groupResponse = await request(app)
    .post("/api/groups")
    .set("Authorization", `Bearer ${alice.token}`)
    .send({ name: "Weekend trip" });

  expect(groupResponse.status).toBe(201);

  const groupId = groupResponse.body._id;

  const memberResponse = await request(app)
    .post(`/api/groups/${groupId}/members`)
    .set("Authorization", `Bearer ${alice.token}`)
    .send({ email: bob.email });

  expect(memberResponse.status).toBe(200);

  return {
    alice,
    bob,
    groupId,
  };
};

describe("Settlement API", () => {
  it("allows a settlement within the outstanding debt", async () => {
    const { alice, bob, groupId } = await createGroupWithMember();

    const expenseResponse = await request(app)
      .post("/api/expenses")
      .set("Authorization", `Bearer ${alice.token}`)
      .send({
        groupId,
        description: "Dinner",
        amount: 10000,
      });

    expect(expenseResponse.status).toBe(201);

    const settlementResponse = await request(app)
      .post("/api/settlements")
      .set("Authorization", `Bearer ${bob.token}`)
      .send({
        groupId,
        to: alice.id,
        amount: 5000,
      });

    expect(settlementResponse.status).toBe(201);
    expect(settlementResponse.body.amount).toBe(5000);
    expect(settlementResponse.body.from._id).toBe(bob.id);
    expect(settlementResponse.body.to._id).toBe(alice.id);
    expect(settlementResponse.body.status).toBe("pending");
  });

  it("rejects a settlement larger than the outstanding debt", async () => {
    const { alice, bob, groupId } = await createGroupWithMember();

    const expenseResponse = await request(app)
      .post("/api/expenses")
      .set("Authorization", `Bearer ${alice.token}`)
      .send({
        groupId,
        description: "Dinner",
        amount: 10000,
      });

    expect(expenseResponse.status).toBe(201);

    const settlementResponse = await request(app)
      .post("/api/settlements")
      .set("Authorization", `Bearer ${bob.token}`)
      .send({
        groupId,
        to: alice.id,
        amount: 5001,
      });

    expect(settlementResponse.status).toBe(400);
    expect(settlementResponse.body).toEqual({
      message: "Settlement amount exceeds the outstanding debt",
    });
  });

  it("rejects a settlement when the sender does not owe the recipient", async () => {
    const { alice, bob, groupId } = await createGroupWithMember();

    const settlementResponse = await request(app)
      .post("/api/settlements")
      .set("Authorization", `Bearer ${alice.token}`)
      .send({
        groupId,
        to: bob.id,
        amount: 1000,
      });

    expect(settlementResponse.status).toBe(400);
    expect(settlementResponse.body).toEqual({
      message: "There is no outstanding debt between these users",
    });
  });

  it("rejects a settlement to yourself", async () => {
    const { alice, groupId } = await createGroupWithMember();

    const settlementResponse = await request(app)
      .post("/api/settlements")
      .set("Authorization", `Bearer ${alice.token}`)
      .send({
        groupId,
        to: alice.id,
        amount: 1000,
      });

    expect(settlementResponse.status).toBe(400);
    expect(settlementResponse.body).toEqual({
      message: "You cannot settle with yourself",
    });
  });
});
