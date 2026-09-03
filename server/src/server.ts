import express, { Application, Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db";
import authRoutes from "./routes/authRoutes";
import groupRoutes from "./routes/groupRoutes";
import expenseRoutes from "./routes/expenseRoutes";
import settlementRoutes from "./routes/settlementRoutes";
import { errorHandler } from "./middleware/errorHandler";

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/settlements", settlementRoutes);

app.use(errorHandler);

// Health check route
app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Splitwise-lite API is running" });
});

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Splitwise-lite Server is running on port ${PORT}`);
  });
};

// Start the server
startServer();
