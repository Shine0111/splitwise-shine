import { Types } from "mongoose";
import { calculateEqualSplit } from "./calculateSplits";

describe("calculateEqualSplit", () => {
  it("splits evenly when amount divides cleanly", () => {
    const memberIds = [new Types.ObjectId(), new Types.ObjectId()];

    const result = calculateEqualSplit(10000, memberIds);

    expect(result).toHaveLength(2);
    expect(result[0].amount).toBe(5000);
    expect(result[1].amount).toBe(5000);
  });

  it("distributes the remainder to the first members", () => {
    const memberIds = [
      new Types.ObjectId(),
      new Types.ObjectId(),
      new Types.ObjectId(),
    ];

    const result = calculateEqualSplit(10000, memberIds);

    expect(result[0].amount).toBe(3334);
    expect(result[1].amount).toBe(3333);
    expect(result[2].amount).toBe(3333);
  });

  it("always sums exactly to the total amount", () => {
    const memberIds = [
      new Types.ObjectId(),
      new Types.ObjectId(),
      new Types.ObjectId(),
      new Types.ObjectId(),
      new Types.ObjectId(),
    ];

    const result = calculateEqualSplit(9999, memberIds);
    const total = result.reduce((sum, split) => sum + split.amount, 0);

    expect(total).toBe(9999);
  });

  it("throws when amount is not a whole number", () => {
    const memberIds = [new Types.ObjectId()];

    expect(() => calculateEqualSplit(100.5, memberIds)).toThrow(
      "Amount must be a whole number for MGA",
    );
  });
});
