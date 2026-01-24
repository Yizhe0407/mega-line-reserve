"use client";

import toast from "react-hot-toast";
import { useMemo } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Plus, Wrench, ArrowLeft } from "lucide-react";
import { ServiceCard } from "@/components/admin/services/ServiceCard";
import Link from "next/link";

const ServiceDialog = dynamic(
  () => import("@/components/admin/services/ServiceDialog").then((mod) => mod.ServiceDialog),
  { ssr: false }
);
const ServiceDeleteDialog = dynamic(
  () =>
    import("@/components/admin/services/ServiceDeleteDialog").then(
      (mod) => mod.ServiceDeleteDialog
    ),
  { ssr: false }
);
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useServices } from "@/hooks/useServices";
import { useServiceDialog } from "@/hooks/useServiceDialog";
import { useDeleteConfirmDialog } from "@/hooks/useDeleteConfirmDialog";
import type { Service } from "@/types";

export default function ServiceAdminPage() {
  const { isAdmin, isLoading: isAuthLoading, error: authError } = useAdminAuth();
  const {
    services,
    error: servicesError,
    setError: setServicesError,
    createService,
    updateService,
    deleteService,
    toggleActive,
    isLoading: isServicesLoading,
  } = useServices(isAdmin === true);

  const serviceDialog = useServiceDialog();
  const deleteDialog = useDeleteConfirmDialog<Service>();

  // Determine global loading state
  const isLoading = isAuthLoading || (isAdmin && isServicesLoading && services.length === 0);

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

  const error = authError || servicesError;

  const sortedServices = useMemo(() => {
    return [...services].sort((a, b) => {
      if (a.isActive && !b.isActive) return -1;
      if (!a.isActive && b.isActive) return 1;
      return 0;
    });
  }, [services]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 text-muted-foreground animate-pulse">
          <div className="w-12 h-12 bg-muted rounded-xl" />
          <div className="h-4 w-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-background px-4 py-10 flex flex-col items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-center text-destructive">權限不足</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
             <p className="text-muted-foreground">此頁面僅提供管理員使用。</p>
            <Link 
              href="/" 
              className="inline-flex h-10 items-center justify-center rounded-xl bg-foreground px-8 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
            >
              回首頁
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="pb-20">

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2">
            <AlertTitle>錯誤</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats & Actions Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-md bg-secondary text-secondary-foreground font-medium">
                {sortedServices.length}
              </span>
              <span>個服務項目</span>
            </div>

            <Button
               type="button"
               onClick={serviceDialog.openAddDialog}
               className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-foreground px-4 text-sm font-semibold text-background transition-all hover:bg-foreground/90 hover:scale-[1.02] active:scale-[0.98] shadow-sm ml-auto"
            >
              <Plus className="w-4 h-4" />
              新增服務
            </Button>
        </div>

        {/* Service Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onClick={() => serviceDialog.openEditDialog(service)}
              />
            ))}
        </div>

        {/* Empty State */}
        {sortedServices.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 border-2 border-dashed border-border rounded-3xl bg-muted/10">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
              <Wrench className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">尚無服務項目</h3>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                點擊上方「新增服務」按鈕來建立您的第一個服務項目
              </p>
            </div>
             <Button
               type="button"
               variant="link"
               onClick={serviceDialog.openAddDialog}
               className="mt-2 text-sm font-medium text-primary hover:underline hover:bg-transparent"
            >
              立即新增
            </Button>
          </div>
        )}
      </main>

      {/* Dialogs */}
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
