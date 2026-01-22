-- CreateIndex
CREATE INDEX `Reserve_timeSlotId_status_idx` ON `Reserve`(`timeSlotId`, `status`);

-- CreateIndex
CREATE INDEX `Reserve_userId_status_idx` ON `Reserve`(`userId`, `status`);

-- CreateIndex
CREATE INDEX `Reserve_date_status_idx` ON `Reserve`(`date`, `status`);

-- CreateIndex
CREATE INDEX `Service_isActive_idx` ON `Service`(`isActive`);

-- CreateIndex
CREATE INDEX `TimeSlot_isActive_idx` ON `TimeSlot`(`isActive`);

-- RenameIndex
ALTER TABLE `ServicesOnReserves` RENAME INDEX `ServicesOnReserves_serviceId_fkey` TO `ServicesOnReserves_serviceId_idx`;
