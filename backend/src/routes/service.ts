import express from 'express';
import { UserRole } from '@prisma/client';
import * as serviceControllers from '../controllers/service';
import { authenticate, checkRole } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createServiceBodySchema, updateServiceBodySchema } from '../validation/service';

export const router = express.Router();

// 公開：讀取服務列表（預約流程選擇服務時使用，無需登入）
router.get('/', serviceControllers.getAllServices);
router.get('/:id', serviceControllers.getServiceById);

// 以下為管理端功能，僅 ADMIN 可建立/修改/刪除服務
router.post('/', authenticate, checkRole(UserRole.ADMIN), validateBody(createServiceBodySchema), serviceControllers.createService);
router.put('/:id', authenticate, checkRole(UserRole.ADMIN), validateBody(updateServiceBodySchema), serviceControllers.updateService);
router.delete('/:id', authenticate, checkRole(UserRole.ADMIN), serviceControllers.deleteService);

