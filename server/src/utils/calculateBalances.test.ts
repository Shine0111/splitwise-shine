import { Types } from "mongoose";
import { calculateNetBalances, simplifyDebts } from "./calculateBalances";

describe("calculateNetBalances", () => {
  it("computes correct net balance for a single shared expense", () => {
    const alice = new Types.ObjectId();
    const bob = new Types.ObjectId();

    const expenses = [
      {
        paidBy: alice,
        amount: 10000,
        splits: [
          { user: alice, amount: 5000 },
          { user: bob, amount: 5000 },
        ],
      },
    ];

    const balances = calculateNetBalances(expenses);

    // Alice paid 10000, owes 5000 of it herself -> net +5000 (owed money)
    expect(balances.get(alice.toString())).toBe(5000);
    // Bob owes his 5000 share, paid nothing -> net -5000 (owes money)
    expect(balances.get(bob.toString())).toBe(-5000);
  });

  it("nets to zero for a self-paid expense with no other splits", () => {
    const alice = new Types.ObjectId();

    const expenses = [
      {
        paidBy: alice,
        amount: 10000,
        splits: [{ user: alice, amount: 10000 }],
      },
    ];

    const balances = calculateNetBalances(expenses);

    expect(balances.get(alice.toString())).toBe(0);
  });

  it("accumulates balances correctly across multiple expenses", () => {
    const alice = new Types.ObjectId();
    const bob = new Types.ObjectId();

    const expenses = [
      {
        paidBy: alice,
        amount: 10000,
        splits: [
          { user: alice, amount: 5000 },
          { user: bob, amount: 5000 },
        ],
      },
      {
        paidBy: bob,
        amount: 4000,
        splits: [
          { user: alice, amount: 2000 },
          { user: bob, amount: 2000 },
        ],
      },
    ];

    const balances = calculateNetBalances(expenses);

    // Alice: +5000 (expense 1) - 2000 (owes on expense 2) = +3000
    expect(balances.get(alice.toString())).toBe(3000);
    // Bob: -5000 (owes on expense 1) + 4000 (paid) - 2000 (owes on expense 2) = -3000
    // Actually: paidBy bob +4000, split bob -2000 => net from expense 2 is +2000
    // Combined with expense 1 (-5000): -5000 + 2000 = -3000
    expect(balances.get(bob.toString())).toBe(-3000);
  });

  it("reduces balance when a confirmed settlement is applied", () => {
    const alice = new Types.ObjectId();
    const bob = new Types.ObjectId();

    const expenses = [
      {
        paidBy: alice,
        amount: 10000,
        splits: [
          { user: alice, amount: 5000 },
          { user: bob, amount: 5000 },
        ],
      },
    ];

    const settlements = [{ from: bob, to: alice, amount: 5000 }];

    const balances = calculateNetBalances(expenses, settlements);

    expect(balances.get(alice.toString())).toBe(0);
    expect(balances.get(bob.toString())).toBe(0);
  });

  it("returns an empty map when there are no expenses", () => {
    const balances = calculateNetBalances([]);

    expect(balances.size).toBe(0);
  });
});

describe("simplifyDebts", () => {
  it("returns no transactions when everyone is already settled", () => {
    const alice = new Types.ObjectId().toString();
    const bob = new Types.ObjectId().toString();

    const balances = new Map<string, number>([
      [alice, 0],
      [bob, 0],
    ]);

    const transactions = simplifyDebts(balances);

    expect(transactions).toHaveLength(0);
  });

  it("produces a single transaction for a simple two-person debt", () => {
    const alice = new Types.ObjectId().toString();
    const bob = new Types.ObjectId().toString();

    const balances = new Map<string, number>([
      [alice, 5000],
      [bob, -5000],
    ]);

    const transactions = simplifyDebts(balances);

    expect(transactions).toHaveLength(1);
    expect(transactions[0]).toEqual({ from: bob, to: alice, amount: 5000 });
  });

  it("minimizes transactions for multiple debtors and one creditor", () => {
    const alice = new Types.ObjectId().toString();
    const bob = new Types.ObjectId().toString();
    const carol = new Types.ObjectId().toString();
    const dave = new Types.ObjectId().toString();

    // Matches the worked example from earlier: Alice +6000, Bob -2000, Carol -1000, Dave -3000
    const balances = new Map<string, number>([
      [alice, 6000],
      [bob, -2000],
      [carol, -1000],
      [dave, -3000],
    ]);

    const transactions = simplifyDebts(balances);

    // 4 people, all debts flow to the single creditor -> exactly 3 transactions (N-1)
    expect(transactions).toHaveLength(3);

    const totalPaidToAlice = transactions
      .filter((t) => t.to === alice)
      .reduce((sum, t) => sum + t.amount, 0);
    expect(totalPaidToAlice).toBe(6000);
  });

  it("never produces a transaction with a zero or negative amount", () => {
    const alice = new Types.ObjectId().toString();
    const bob = new Types.ObjectId().toString();
    const carol = new Types.ObjectId().toString();

    const balances = new Map<string, number>([
      [alice, 3000],
      [bob, -1000],
      [carol, -2000],
    ]);

    const transactions = simplifyDebts(balances);

    transactions.forEach((t) => {
      expect(t.amount).toBeGreaterThan(0);
    });
  });

  it("ignores users with a zero balance entirely", () => {
    const alice = new Types.ObjectId().toString();
    const bob = new Types.ObjectId().toString();
    const carol = new Types.ObjectId().toString();

    const balances = new Map<string, number>([
      [alice, 5000],
      [bob, -5000],
      [carol, 0],
    ]);

    const transactions = simplifyDebts(balances);

    const involvesCarol = transactions.some(
      (t) => t.from === carol || t.to === carol,
    );
    expect(involvesCarol).toBe(false);
  });
});
