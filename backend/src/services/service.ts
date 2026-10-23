import * as serviceModel from "../model/service";
import { CreateServiceDTO, Service, UpdateServiceDTO } from "../types/service";
import { NotFoundError, ValidationError } from "../types/errors";
import { clearCache, getCache, setCache } from "../utils/cache";
import { parsePositiveIntParam } from "../utils/params";

const SERVICES_CACHE_KEY = "services:all";

export const getAllServices = async () => {
    const cached = getCache<Service[]>(SERVICES_CACHE_KEY);
    if (cached) return cached;
    const services = await serviceModel.getAllServices();
    setCache(SERVICES_CACHE_KEY, services);
    return services;
};

export const getServiceById = async (idParam: string | string[]) => {
    const id = parsePositiveIntParam(idParam, "服務");

    const service = await serviceModel.getServiceById(id);
    if (!service) {
        throw new NotFoundError("服務不存在");
    }
    return service;
};

export const createService = async (serviceData: CreateServiceDTO) => {
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
    
    const created = await serviceModel.createService(serviceData);
    clearCache("services:");
    return created;
};

export const updateService = async (idParam: string | string[], data: UpdateServiceDTO) => {
    const id = parsePositiveIntParam(idParam, "服務");

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
    
    const updated = await serviceModel.updateService(id, data);
    clearCache("services:");
    return updated;
};

export const deleteService = async (idParam: string | string[]) => {
    const id = parsePositiveIntParam(idParam, "服務");

    // 檢查服務是否存在
    const existingService = await serviceModel.getServiceById(id);
    if (!existingService) {
        throw new NotFoundError("服務不存在");
    }
    
    const deleted = await serviceModel.deleteService(id);
    clearCache("services:");
    return deleted;
};
