import Group from "../models/Group";
import User from "../models/User";
import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import { asyncHandler } from "../utils/asyncHandler";
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} from "../utils/errors";

export const createGroup = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { name } = req.body;

    if (!name) {
      throw new BadRequestError("Group name is required");
    }

    if (!req.user) {
      throw new UnauthorizedError("Not authorized");
    }

    const group = await Group.create({
      name,
      creator: req.user._id,
      members: [req.user._id],
    });

    res.status(201).json(group);
  },
);

export const getMyGroups = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new UnauthorizedError("Not authorized");
    }

    const groups = await Group.find({ members: req.user._id })
      .populate("members", "name email")
      .populate("creator", "name email");

    res.status(200).json(groups);
  },
);

export const addMember = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { groupId } = req.params;
    const { email } = req.body;

    if (!email) {
      throw new BadRequestError("Email is required");
    }

    const group = await Group.findById(groupId);
    if (!group) {
      throw new NotFoundError("Group not found");
    }

    // Find user to add by email
    const userToAdd = await User.findOne({ email });
    if (!userToAdd) {
      throw new NotFoundError("User not found");
    }

    // Check if the user is already a member
    const alreadyMember = group.members.some(
      (memberId) => memberId.toString() === userToAdd._id.toString(),
    );

    if (alreadyMember) {
      throw new BadRequestError("User is already a member");
    }

    // Add user to group
    group.members.push(userToAdd._id);
    await group.save();

    const updatedGroup = await Group.findById(groupId).populate(
      "members",
      "name email",
    );

    res.status(200).json(updatedGroup);
  },
);
