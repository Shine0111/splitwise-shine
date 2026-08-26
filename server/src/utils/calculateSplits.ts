import { Types } from "mongoose";

interface Split {
  user: Types.ObjectId;
  amount: number;
}

export const calculateEqualSplit = (
  totalAmount: number,
  memberIds: Types.ObjectId[],
): Split[] => {
  if (!Number.isInteger(totalAmount)) {
    throw new Error("Amount must be a whole number for MGA");
  }

  const numMembers = memberIds.length;
  const baseAmount = Math.floor(totalAmount / numMembers);
  const remainder = totalAmount % numMembers;

  return memberIds.map((userId, index) => {
    const amount = index < remainder ? baseAmount + 1 : baseAmount;
    return {
      user: userId,
      amount,
    };
  });
};
