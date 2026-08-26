import mongoose, { Schema, Document, Types } from "mongoose";

interface ISplit {
  user: Types.ObjectId;
  amount: number;
}

export interface IExpense extends Document {
  group: Types.ObjectId;
  paidBy: Types.ObjectId;
  description: string;
  amount: number;
  splits: ISplit[];
  createdAt: Date;
  updatedAt: Date;
}

const splitSchema = new Schema<ISplit>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: false,
  },
);

const expenseSchema = new Schema<IExpense>(
  {
    group: {
      type: Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    paidBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    splits: {
      type: [splitSchema],
      required: true,
      validate: {
        validator: function (splits: ISplit[]) {
          return splits.length > 0;
        },
        message: "Expense must have at least one split.",
      },
    },
  },
  { timestamps: true },
);

const Expense = mongoose.model<IExpense>("Expense", expenseSchema);

export default Expense;
