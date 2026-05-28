import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { authenticate, AuthRequest } from "../middlewares/auth";

const router = Router();
const getSecret = () => process.env.SESSION_SECRET || "change-me-to-a-long-random-string";

// Register a new user
router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: "Email already in use" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({ email, passwordHash });

    const token = jwt.sign({ userId: user._id.toString() }, getSecret(), {
      expiresIn: "7d",
    });

    return res.status(201).json({ token, user: user.toJSON() });
  } catch (err) {
    req.log.error({ err }, "Registration failed");
    return res.status(500).json({ error: "Registration failed" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user._id.toString() }, getSecret(), {
      expiresIn: "7d",
    });

    return res.json({ token, user: user.toJSON() });
  } catch (err) {
    req.log.error({ err }, "Login failed");
    return res.status(500).json({ error: "Login failed" });
  }
});

// Protected me route
router.get("/me", authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.user?.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json(user.toJSON());
  } catch (err) {
    req.log.error({ err }, "Fetch user failed");
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
