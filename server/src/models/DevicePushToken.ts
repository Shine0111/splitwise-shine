import mongoose, { Schema, Types } from "mongoose";

export interface IDevicePushToken extends Document {
  user: Types.ObjectId;
  expoPushToken: string;
  platform: "ios" | "android";
  enabled: boolean;
  lastSeenAt: Date;
}

const devicePushTokenSchema = new Schema<IDevicePushToken>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    expoPushToken: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    platform: {
      type: String,
      enum: ["ios", "android"],
      required: true,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    lastSeenAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

const DevicePushToken = mongoose.model<IDevicePushToken>(
  "DevicePushToken",
  devicePushTokenSchema,
);

export default DevicePushToken;
