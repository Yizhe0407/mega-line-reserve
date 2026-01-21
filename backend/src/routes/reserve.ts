import express from 'express';
import * as reserveControllers from '../controllers/reserve';
import { authenticate } from '../middleware/auth';

export const router = express.Router();

// 所有預約路由都需要認證
router.use(authenticate);

router.get('/', reserveControllers.getReserves);
router.post('/', reserveControllers.createReserve);
router.get('/:id', reserveControllers.getReserveById);
router.put('/:id', reserveControllers.updateReserve);
router.delete('/:id', reserveControllers.deleteReserve);

