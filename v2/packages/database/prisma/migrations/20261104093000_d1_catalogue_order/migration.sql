-- The catalogue's own order (ADR-0013). NOT NULL without a default is safe: these tables were
-- created in 20261104091921_d1_catalogue and have never held rows outside development.

-- AlterTable
ALTER TABLE "course" ADD COLUMN     "catalogue_order" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "engineering_area" ADD COLUMN     "catalogue_order" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "experiment" ADD COLUMN     "catalogue_order" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "course_catalogue_order_key" ON "course"("catalogue_order");

-- CreateIndex
CREATE UNIQUE INDEX "engineering_area_catalogue_order_key" ON "engineering_area"("catalogue_order");

-- CreateIndex
CREATE UNIQUE INDEX "experiment_catalogue_order_key" ON "experiment"("catalogue_order");


-- Hand-written CHECK constraints (see 20261104091921_d1_catalogue).
ALTER TABLE "engineering_area" ADD CONSTRAINT "engineering_area_catalogue_order_check" CHECK ("catalogue_order" >= 0);
ALTER TABLE "course" ADD CONSTRAINT "course_catalogue_order_check" CHECK ("catalogue_order" >= 0);
ALTER TABLE "experiment" ADD CONSTRAINT "experiment_catalogue_order_check" CHECK ("catalogue_order" >= 0);
