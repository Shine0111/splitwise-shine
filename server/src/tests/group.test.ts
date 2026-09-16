import request from "supertest";
import app from "../app";
import Group from "../models/Group";

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

describe("Group API", () => {
  describe("POST /api/groups/:groupId/members", () => {
    it("allows the group creator to add a user", async () => {
      const alice = await registerUser("Alice", "alice@example.com");
      const carol = await registerUser("Carol", "carol@example.com");

      const createGroupResponse = await request(app)
        .post("/api/groups")
        .set("Authorization", `Bearer ${alice.token}`)
        .send({ name: "Weekend trip" });

      expect(createGroupResponse.status).toBe(201);

      const groupId = createGroupResponse.body._id;

      const addMemberResponse = await request(app)
        .post(`/api/groups/${groupId}/members`)
        .set("Authorization", `Bearer ${alice.token}`)
        .send({ email: carol.email });

      expect(addMemberResponse.status).toBe(200);

      const memberIds = addMemberResponse.body.members.map(
        (member: { _id: string }) => member._id,
      );

      expect(memberIds).toEqual(expect.arrayContaining([alice.id, carol.id]));
    });

    it("rejects a non-creator trying to add a user", async () => {
      const alice = await registerUser("Alice", "alice@example.com");
      const bob = await registerUser("Bob", "bob@example.com");
      const carol = await registerUser("Carol", "carol@example.com");

      const createGroupResponse = await request(app)
        .post("/api/groups")
        .set("Authorization", `Bearer ${alice.token}`)
        .send({ name: "Weekend trip" });

      expect(createGroupResponse.status).toBe(201);

      const groupId = createGroupResponse.body._id;

      const addMemberResponse = await request(app)
        .post(`/api/groups/${groupId}/members`)
        .set("Authorization", `Bearer ${bob.token}`)
        .send({ email: carol.email });

      expect(addMemberResponse.status).toBe(403);
      expect(addMemberResponse.body).toEqual({
        message: "Only the group creator can add members",
      });

      const group = await Group.findById(groupId);

      expect(group).not.toBeNull();
      expect(group!.members.map((memberId) => memberId.toString())).toEqual([
        alice.id,
      ]);
    });
  });
});
