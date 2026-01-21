import * as serviceModel from "../model/service";
import { Service } from "../types/service";
import { NotFoundError, ValidationError } from "../types/errors";

export const getAllServices = () => {
    return serviceModel.getAllServices();
};

export const getServiceById = async (idParam: string | string[]) => {
    const id = parseInt(Array.isArray(idParam) ? idParam[0] : idParam);
    if (isNaN(id)) {
        throw new ValidationError("無效的服務 ID");
    }

    const service = await serviceModel.getServiceById(id);
    if (!service) {
        throw new NotFoundError("服務不存在");
    }
    return service;
};

export const createService = async (serviceData: Service) => {
    // 檢查必要欄位
    if (!serviceData.name?.trim()) {
        throw new ValidationError("服務名稱不能為空");
    }
    if (serviceData.duration !== undefined && serviceData.duration <= 0) {
        throw new ValidationError("服務時長必須大於 0");
    }
    if (serviceData.price !== undefined && serviceData.price < 0) {
        throw new ValidationError("價格不能為負數");
    }
    
    return serviceModel.createService(serviceData);
};

export const updateService = async (idParam: string | string[], data: Partial<Service>) => {
    const id = parseInt(Array.isArray(idParam) ? idParam[0] : idParam);
    if (isNaN(id)) {
        throw new ValidationError("無效的服務 ID");
    }

    // 檢查服務是否存在
    const existingService = await serviceModel.getServiceById(id);
    if (!existingService) {
        throw new NotFoundError("服務不存在");
    }
    
    // 檢查更新資料的合法性
    if (data.name !== undefined && !data.name.trim()) {
        throw new ValidationError("服務名稱不能為空");
    }
    if (data.duration !== undefined && data.duration <= 0) {
        throw new ValidationError("服務時長必須大於 0");
    }
    if (data.price !== undefined && data.price < 0) {
        throw new ValidationError("價格不能為負數");
    }
    
    return serviceModel.updateService(id, data);
};

export const deleteService = async (idParam: string | string[]) => {
    const id = parseInt(Array.isArray(idParam) ? idParam[0] : idParam);
    if (isNaN(id)) {
        throw new ValidationError("無效的服務 ID");
    }

    // 檢查服務是否存在
    const existingService = await serviceModel.getServiceById(id);
    if (!existingService) {
        throw new NotFoundError("服務不存在");
    }
    
    return serviceModel.deleteService(id);
};
