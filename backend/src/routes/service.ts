import express from 'express';
import { UserRole } from '@prisma/client';
import * as serviceControllers from '../controllers/service';
import { authenticate, checkRole } from '../middleware/auth';

export const router = express.Router();

// 公開：讀取服務列表（預約流程選擇服務時使用，無需登入）
router.get('/', serviceControllers.getAllServices);
router.get('/:id', serviceControllers.getServiceById);

// 以下為管理端功能，僅 ADMIN 可建立/修改/刪除服務
router.post('/', authenticate, checkRole(UserRole.ADMIN), serviceControllers.createService);
router.put('/:id', authenticate, checkRole(UserRole.ADMIN), serviceControllers.updateService);
router.delete('/:id', authenticate, checkRole(UserRole.ADMIN), serviceControllers.deleteService);

