import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import otpGenerator from "otp-generator";
import nodemailer from "nodemailer";
import { UserModel } from "../models/Users.js";

const router = express.Router();
const otpStore = new Map(); // Use Redis or DB in production

// Nodemailer Transporter
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "suresh306dm@gmail.com",      // Your Gmail
        pass: "iuiyouxqwdcmmert"          // App password from Gmail
    }
});

// Register Route
router.post("/register", async (req, res) => {
    const { username, password } = req.body;

    const existingUser = await UserModel.findOne({ username });
    if (existingUser) {
        return res.json({ message: "User already exists!!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new UserModel({ username, password: hashedPassword });
    await newUser.save();

    res.json({ message: "User Registered successfully!!" });
});

// Send OTP via Email
router.post("/send-otp", async (req, res) => {
    const { username } = req.body;

    const user = await UserModel.findOne({ username });
    if (!user) {
        return res.json({ message: "User not found!" });
    }

    const otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        specialChars: false
    });

    otpStore.set(username, { otp, createdAt: Date.now() });

    const mailOptions = {
        from: "suresh306dm@gmail.com",
        to: username,
        subject: "Your OTP for Login",
        text: `Your OTP is: ${otp}. It expires in 5 minutes.`
    };

    try {
        await transporter.sendMail(mailOptions);
        res.json({ message: "OTP sent to your email successfully!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to send OTP." });
    }
});

// Verify OTP and Login
router.post("/verify-otp", async (req, res) => {
    const { username, otp } = req.body;

    const stored = otpStore.get(username);
    if (!stored) {
        return res.status(400).json({ message: "OTP not requested or expired!" });
    }

    const isValid = stored.otp === otp;
    const isExpired = (Date.now() - stored.createdAt) > 5 * 60 * 1000;

    if (!isValid || isExpired) {
        return res.status(401).json({ message: "Invalid or expired OTP" });
    }

    const user = await UserModel.findOne({ username });
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    const token = jwt.sign({ id: user._id }, "secret");
    otpStore.delete(username);

    res.json({ message: "Login successful via OTP", token, userID: user._id });
});

// Token Verification Middleware
export const verifyToken = (req, res, next) => {
    const token = req.headers.authorization;
    if (token) {
        jwt.verify(token, "secret", (err) => {
            if (err) return res.sendStatus(403);
            next();
        });
    } else {
        res.sendStatus(401);
    }
};

export { router as userRouter };
