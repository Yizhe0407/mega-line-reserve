import express from "express";
import { UserRole } from "@prisma/client";
import * as timeSlotControllers from "../controllers/timeSlot";
import { authenticate, checkRole } from "../middleware/auth";

export const router = express.Router();

// 公開可用時段 (基本定義)
router.get("/active", timeSlotControllers.getActiveTimeSlots);

// 查詢特定日期的時段可用性
router.get("/available", timeSlotControllers.getAvailableTimeSlots);

// 以下為管理端功能
router.use(authenticate);

router.get("/", checkRole(UserRole.ADMIN), timeSlotControllers.getAllTimeSlots);
router.post("/", checkRole(UserRole.ADMIN), timeSlotControllers.createTimeSlot);
router.get("/:id", checkRole(UserRole.ADMIN), timeSlotControllers.getTimeSlotById);
router.put("/:id", checkRole(UserRole.ADMIN), timeSlotControllers.updateTimeSlot);
router.delete("/:id", checkRole(UserRole.ADMIN), timeSlotControllers.deleteTimeSlot);
