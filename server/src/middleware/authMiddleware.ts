import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/User";
import { UnauthorizedError } from "../utils/errors";
import Session from "../models/Session";

export interface AuthRequest extends Request {
  user?: IUser;
  tokenJti?: string;
}

interface JwtPayload {
  id: string;
  jti: string;
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

    if (!decoded.jti) {
      throw new UnauthorizedError("Not authorized, session required");
    }

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      throw new UnauthorizedError("Not authorized, user not found");
    }

    const session = await Session.findOne({
      user: user._id,
      jti: decoded.jti,
      revokedAt: { $exists: false },
    });

    if (!session) {
      throw new UnauthorizedError("Not authorized, session revoked");
    }

    req.tokenJti = decoded.jti;

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export default protect;
