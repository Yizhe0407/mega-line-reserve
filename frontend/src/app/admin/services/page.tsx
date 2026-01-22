"use client";

import toast from "react-hot-toast";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Plus } from "lucide-react";
import { ServiceCard } from "@/components/admin/services/ServiceCard";
import { ServiceDialog } from "@/components/admin/services/ServiceDialog";
import { ServiceDeleteDialog } from "@/components/admin/services/ServiceDeleteDialog";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useServices } from "@/hooks/useServices";
import { useServiceDialog } from "@/hooks/useServiceDialog";
import { useDeleteConfirmDialog } from "@/hooks/useDeleteConfirmDialog";
import type { Service } from "@/types";

export default function ServiceAdminPage() {
  const router = useRouter();
  const { isAdmin, isLoading, error: authError } = useAdminAuth();
  const {
    services,
    error: servicesError,
    setError: setServicesError,
    loadServices,
    createService,
    updateService,
    deleteService,
    toggleActive,
  } = useServices();

  const serviceDialog = useServiceDialog();
  const deleteDialog = useDeleteConfirmDialog<Service>();

  // 初始載入服務
  useEffect(() => {
    if (isAdmin) {
      loadServices();
    }
  }, [isAdmin, loadServices]);

  const handleDialogSubmit = async () => {
    if (!serviceDialog.name.trim()) {
      setServicesError("請輸入服務名稱");
      return;
    }
    try {
      setServicesError(null);

      const data = {
        name: serviceDialog.name.trim(),
        description: serviceDialog.description.trim() || undefined,
        price: serviceDialog.price !== undefined && serviceDialog.price !== null 
          ? serviceDialog.price 
          : undefined,
        duration: serviceDialog.duration !== undefined && serviceDialog.duration !== null
          ? serviceDialog.duration
          : undefined,
      };

      if (serviceDialog.editingService) {
        // 更新
        await updateService(serviceDialog.editingService.id, data);
        toast.success("服務已更新");
      } else {
        // 新增
        await createService(data);
        toast.success("服務已新增");
      }

      serviceDialog.closeDialog();
      serviceDialog.resetForm();
    } catch (err) {
      const message = err instanceof Error ? err.message : "操作失敗";
      setServicesError(message);
      toast.error(message);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.itemToDelete) return;
    try {
      setServicesError(null);
      await deleteService(deleteDialog.itemToDelete.id);
      deleteDialog.closeDialog();
      toast.success("服務已刪除");
    } catch (err) {
      const message = err instanceof Error ? err.message : "刪除失敗";
      setServicesError(message);
      toast.error(message);
    }
  };

  const handleToggleActive = async () => {
    if (!serviceDialog.editingService) return;
    await toggleActive(serviceDialog.editingService);
    // 更新 dialog 中的 editingService 狀態
    serviceDialog.setEditingService({
      ...serviceDialog.editingService,
      isActive: !serviceDialog.editingService.isActive,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>服務管理</CardTitle>
          </CardHeader>
          <CardContent>載入中...</CardContent>
        </Card>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-background px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>服務管理</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTitle>權限不足</AlertTitle>
              <AlertDescription>此頁面僅提供管理員使用。</AlertDescription>
            </Alert>
            <Button onClick={() => router.push("/")}>回首頁</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const error = authError || servicesError;

  const sortedServices = useMemo(() => {
    return [...services].sort((a, b) => {
      if (a.isActive && !b.isActive) return -1;
      if (!a.isActive && b.isActive) return 1;
      return 0;
    });
  }, [services]);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">服務管理</h1>
          <Button onClick={serviceDialog.openAddDialog}>
            <Plus className="w-4 h-4 mr-2" />
            新增服務
          </Button>
        </div>

        {error && (
          <Alert>
            <AlertTitle>錯誤</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onClick={() => serviceDialog.openEditDialog(service)}
              />
            ))}
        </div>

        {services.length === 0 && !error && (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              尚無服務項目，點擊「新增服務」開始建立
            </CardContent>
          </Card>
        )}
      </div>

      <ServiceDialog
        open={serviceDialog.isOpen}
        onOpenChange={serviceDialog.setIsOpen}
        editingService={serviceDialog.editingService}
        name={serviceDialog.name}
        description={serviceDialog.description}
        price={serviceDialog.price}
        duration={serviceDialog.duration}
        onNameChange={serviceDialog.setName}
        onDescriptionChange={serviceDialog.setDescription}
        onPriceChange={serviceDialog.setPrice}
        onDurationChange={serviceDialog.setDuration}
        onSubmit={handleDialogSubmit}
        onToggleActive={serviceDialog.editingService ? handleToggleActive : undefined}
        onDelete={
          serviceDialog.editingService
            ? () => {
                serviceDialog.closeDialog();
                deleteDialog.openDialog(serviceDialog.editingService!);
              }
            : undefined
        }
      />

      <ServiceDeleteDialog
        open={deleteDialog.isOpen}
        onOpenChange={deleteDialog.setIsOpen}
        service={deleteDialog.itemToDelete}
        onConfirm={handleDelete}
      />
    </div>
  );
}
