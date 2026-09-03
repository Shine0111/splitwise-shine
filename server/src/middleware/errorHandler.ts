import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  console.error("Unexpected error:", err);
  res.status(500).json({ message: "Server error" });
};
