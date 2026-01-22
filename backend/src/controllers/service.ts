import { Response, NextFunction } from 'express';
import * as serviceService from "../services/service";
import { AuthRequest } from "../types/express";

export const getAllServices = (req: AuthRequest, res: Response, next: NextFunction) => {
    serviceService.getAllServices()
        .then((services) => {
            res.set("Cache-Control", "public, max-age=30, stale-while-revalidate=30");
            res.json(services);
        })
        .catch(next);
};

export const getServiceById = (req: AuthRequest, res: Response, next: NextFunction) => {
    serviceService.getServiceById(req.params.id)
        .then((service) => res.json(service))
        .catch(next);
};

export const createService = (req: AuthRequest, res: Response, next: NextFunction) => {
    serviceService.createService(req.body)
        .then((service) => res.status(201).json(service))
        .catch(next);
};

export const updateService = (req: AuthRequest, res: Response, next: NextFunction) => {
    serviceService.updateService(req.params.id, req.body)
        .then((service) => res.json(service))
        .catch(next);
};

export const deleteService = (req: AuthRequest, res: Response, next: NextFunction) => {
    serviceService.deleteService(req.params.id)
        .then(() => res.json({ message: "Service deleted successfully" }))
        .catch(next);
};