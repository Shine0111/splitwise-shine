import Group from "../models/Group";
import User from "../models/User";
import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";

export const createGroup = async (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Group name is required" });
    }

    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const group = await Group.create({
      name,
      creator: req.user._id,
      members: [req.user._id],
    });

    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const getMyGroups = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const groups = await Group.find({ members: req.user._id })
      .populate("members", "name email")
      .populate("creator", "name email");

    res.status(200).json(groups);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const addMember = async (req: AuthRequest, res: Response) => {
  try {
    const { groupId } = req.params;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Find user to add by email
    const userToAdd = await User.findOne({ email });
    if (!userToAdd) {
      return res
        .status(404)
        .json({ message: "User with that email not found" });
    }

    // Check if the user is already a member
    const alreadyMember = group.members.some(
      (memberId) => memberId.toString() === userToAdd._id.toString(),
    );

    if (alreadyMember) {
      return res.status(400).json({ message: "User is already a member" });
    }

    // Add user to group
    group.members.push(userToAdd._id);
    await group.save();

    const updatedGroup = await Group.findById(groupId).populate(
      "members",
      "name email",
    );

    res.status(200).json(updatedGroup);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
