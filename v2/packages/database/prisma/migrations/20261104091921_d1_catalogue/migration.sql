/*
  Warnings:

  - You are about to drop the `foundation_probe` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "technology" AS ENUM ('web', 'vr', 'mr', 'ar');

-- DropTable
DROP TABLE "foundation_probe";

-- CreateTable
CREATE TABLE "engineering_area" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "artwork_key" VARCHAR(200),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "engineering_area_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course" (
    "id" TEXT NOT NULL,
    "area_id" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "platform_code" VARCHAR(40),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experiment" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "artwork_key" VARCHAR(200),
    "live_version_id" UUID,
    "published_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "experiment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experiment_version" (
    "id" UUID NOT NULL,
    "experiment_id" TEXT NOT NULL,
    "label" VARCHAR(20) NOT NULL,
    "live_from" TIMESTAMP(3) NOT NULL,
    "live_until" TIMESTAMP(3),
    "name" VARCHAR(200) NOT NULL,
    "summary" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "preview_label" VARCHAR(200),
    "preview_link" TEXT,

    CONSTRAINT "experiment_version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experiment_version_format" (
    "version_id" UUID NOT NULL,
    "format" "technology" NOT NULL,
    "web_link" TEXT,
    "browser_and_computer" TEXT,
    "package_label" TEXT,
    "package_reference" TEXT,
    "package_file_name" TEXT,
    "device_needed" TEXT,
    "install_notes" TEXT,
    "notes" TEXT,

    CONSTRAINT "experiment_version_format_pkey" PRIMARY KEY ("version_id","format")
);

-- CreateTable
CREATE TABLE "learning_outcome" (
    "id" TEXT NOT NULL,
    "experiment_id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "learning_outcome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "featured_experiment" (
    "experiment_id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "featured_experiment_pkey" PRIMARY KEY ("experiment_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "engineering_area_name_key" ON "engineering_area"("name");

-- CreateIndex
CREATE UNIQUE INDEX "course_name_key" ON "course"("name");

-- CreateIndex
CREATE INDEX "course_area_id_idx" ON "course"("area_id");

-- CreateIndex
CREATE UNIQUE INDEX "experiment_live_version_id_key" ON "experiment"("live_version_id");

-- CreateIndex
CREATE INDEX "experiment_course_id_idx" ON "experiment"("course_id");

-- CreateIndex
CREATE UNIQUE INDEX "experiment_live_version_id_id_key" ON "experiment"("live_version_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "experiment_version_experiment_id_label_key" ON "experiment_version"("experiment_id", "label");

-- CreateIndex
CREATE UNIQUE INDEX "experiment_version_id_experiment_id_key" ON "experiment_version"("id", "experiment_id");

-- CreateIndex
CREATE UNIQUE INDEX "learning_outcome_experiment_id_position_key" ON "learning_outcome"("experiment_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "featured_experiment_position_key" ON "featured_experiment"("position");

-- AddForeignKey
ALTER TABLE "course" ADD CONSTRAINT "course_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "engineering_area"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experiment" ADD CONSTRAINT "experiment_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experiment" ADD CONSTRAINT "experiment_live_version_id_id_fkey" FOREIGN KEY ("live_version_id", "id") REFERENCES "experiment_version"("id", "experiment_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experiment_version" ADD CONSTRAINT "experiment_version_experiment_id_fkey" FOREIGN KEY ("experiment_id") REFERENCES "experiment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experiment_version_format" ADD CONSTRAINT "experiment_version_format_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "experiment_version"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_outcome" ADD CONSTRAINT "learning_outcome_experiment_id_fkey" FOREIGN KEY ("experiment_id") REFERENCES "experiment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "featured_experiment" ADD CONSTRAINT "featured_experiment_experiment_id_fkey" FOREIGN KEY ("experiment_id") REFERENCES "experiment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Hand-written CHECK constraints (Prisma does not model CHECK; it neither creates nor drops them).

-- A WEB format is a hosted link; an AR / VR / MR format is a package (STK31-37, FormatDelivery).
ALTER TABLE "experiment_version_format" ADD CONSTRAINT "experiment_version_format_delivery_check" CHECK (
    ("format" = 'web'
        AND "web_link" IS NOT NULL AND "browser_and_computer" IS NOT NULL
        AND "package_label" IS NULL AND "package_reference" IS NULL AND "package_file_name" IS NULL
        AND "device_needed" IS NULL AND "install_notes" IS NULL)
    OR ("format" <> 'web'
        AND "package_label" IS NOT NULL AND "device_needed" IS NOT NULL AND "install_notes" IS NOT NULL
        AND "web_link" IS NULL AND "browser_and_computer" IS NULL)
);

-- A version stops being live after it became live; positions count from zero.
ALTER TABLE "experiment_version" ADD CONSTRAINT "experiment_version_live_period_check" CHECK ("live_until" IS NULL OR "live_until" > "live_from");
ALTER TABLE "learning_outcome" ADD CONSTRAINT "learning_outcome_position_check" CHECK ("position" >= 0);
ALTER TABLE "featured_experiment" ADD CONSTRAINT "featured_experiment_position_check" CHECK ("position" >= 0);
