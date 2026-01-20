import axios from "axios";
import { NextFunction } from 'express';
import { UserRole } from "@prisma/client";

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    
};

export const checkRole = (role: UserRole) => (req: Request, res: Response, next: NextFunction) => {
    
};