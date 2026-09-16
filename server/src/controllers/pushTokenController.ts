import { Response } from "express";
import DevicePushToken from "../models/DevicePushToken";
import { AuthRequest } from "../middleware/authMiddleware";
import { asyncHandler } from "../utils/asyncHandler";
import { BadRequestError, UnauthorizedError } from "../utils/errors";

export const registerPushToken = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { expoPushToken, platform } = req.body;

    if (
      typeof expoPushToken !== "string" ||
      !expoPushToken.trim() ||
      (platform !== "ios" && platform !== "android")
    ) {
      throw new BadRequestError(
        "expoPushToken and a valid platform are required",
      );
    }

    if (!req.user) {
      throw new UnauthorizedError("Not authorized");
    }

    await DevicePushToken.findOneAndUpdate(
      { expoPushToken: expoPushToken.trim() },
      {
        user: req.user._id,
        expoPushToken: expoPushToken.trim(),
        platform,
        enabled: true,
        lastSeenAt: new Date(),
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    );

    res.status(200).json({
      message: "Push token registered",
    });
  },
);
