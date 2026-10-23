import { prisma } from "../config/database";
import { CreateServiceDTO, UpdateServiceDTO } from "../types/service";

export const getAllServices = () => {
    return prisma.service.findMany();
};

export const getServiceById = (id: number) => {
    return prisma.service.findUnique({
        where: { id },
    });
};

export const getActiveServicesByIds = (ids: number[]) => {
    return prisma.service.findMany({
        where: {
            id: { in: ids },
            isActive: true
        }
    });
};

export const createService = (serviceData: CreateServiceDTO) => {
    return prisma.service.create({
        data: serviceData,
    });
};

export const updateService = (id: number, data: UpdateServiceDTO) => {
    return prisma.service.update({
        where: { id },
        data,
    });
};

export const deleteService = (id: number) => {
    return prisma.service.delete({
        where: { id },
    });
};