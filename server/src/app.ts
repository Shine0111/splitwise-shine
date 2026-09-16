import express, { Application, Request, Response } from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes";
import groupRoutes from "./routes/groupRoutes";
import expenseRoutes from "./routes/expenseRoutes";
import settlementRoutes from "./routes/settlementRoutes";
import { errorHandler } from "./middleware/errorHandler";
import pushTokenRoutes from "./routes/pushTokenRoutes";

const app: Application = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/settlements", settlementRoutes);
app.use("/api/push-tokens", pushTokenRoutes);

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Splitwise-lite API is running" });
});

app.use(errorHandler);

export default app;
