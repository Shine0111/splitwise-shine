import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User";
import generateToken from "../utils/generateToken";
import { AuthRequest } from "../middleware/authMiddleware";
import { asyncHandler } from "../utils/asyncHandler";
import {
  BadRequestError,
  ConflictError,
  UnauthorizedError,
} from "../utils/errors";

export const registerUser = asyncHandler(
  async (req: Request, res: Response) => {
    const { name, email, password } = req.body;

    // Check if info is not completed
    if (!name || !email || !password) {
      throw new BadRequestError("All fields are required");
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ConflictError("Email already in use");
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    const token = generateToken(user._id.toString());

    res.status(201).json({
      id: user._id,
      name: user.name,
      email: user.email,
      token,
    });
  },
);

export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Check if info is not complete
  if (!email || !password) {
    throw new BadRequestError("Email and password are required");
  }

  // Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    throw new UnauthorizedError("Invalid credentials");
  }

  // Check if password matches
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new UnauthorizedError("Invalid credentials");
  }

  // Generate token
  const token = generateToken(user._id.toString());

  res.status(200).json({
    id: user._id,
    name: user.name,
    email: user.email,
    token,
  });
});

export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.status(200).json({
    user: req.user,
  });
});
