import express from "express";
import authController from "../controllers/auth.controller";

const router = express.Router();

router.get("/auth/register", authController.register);

export default router;
