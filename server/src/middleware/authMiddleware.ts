import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/User";
import { UnauthorizedError } from "../utils/errors";

export interface AuthRequest extends Request {
  user?: IUser;
}

interface JwtPayload {
  id: string;
}

const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError("Not authorized, no token");
    }

    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error("JWT_SECRET is not defined");
    }

    let decoded: JwtPayload;

    try {
      decoded = jwt.verify(token, secret) as JwtPayload;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError("Not authorized, token failed");
      }

      throw error;
    }

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      throw new UnauthorizedError("Not authorized, user not found");
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export default protect;
