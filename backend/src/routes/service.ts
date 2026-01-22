import express from 'express';
import * as serviceControllers from '../controllers/service';

export const router = express.Router();

router.get('/', serviceControllers.getAllServices);

router.post('/', serviceControllers.createService);

router.get('/:id', serviceControllers.getServiceById);

router.put('/:id', serviceControllers.updateService);

router.delete('/:id', serviceControllers.deleteService);


