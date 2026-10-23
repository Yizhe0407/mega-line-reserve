import { Router } from 'express';
import * as userController from '../controllers/user';
import { authenticate, checkRole, checkSelfOrAdmin } from '../middleware/auth';
import { UserRole } from '@prisma/client';
import { validateBody } from '../middleware/validate';
import { createUserBodySchema, updateUserBodySchema } from '../validation/user';

const router = Router();

// 所有路由都需要認證
router.use(authenticate);

// 取得單一使用者（本人或 ADMIN，根據 LINE ID）
router.get('/line/:lineId', checkSelfOrAdmin('lineId'), userController.getUserByLineId);

// 取得單一使用者（本人或 ADMIN，根據 ID）
router.get('/:id', checkSelfOrAdmin('id'), userController.getUserById);

// 建立使用者（僅 ADMIN）
router.post('/', checkRole(UserRole.ADMIN), validateBody(createUserBodySchema), userController.createUser);

// 更新使用者（使用者只能更新自己）
router.put('/:id', validateBody(updateUserBodySchema), userController.updateUser);

// 刪除使用者（僅 ADMIN）
router.delete('/:id', checkRole(UserRole.ADMIN), userController.deleteUser);

export default router;
