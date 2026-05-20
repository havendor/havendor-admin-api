/*
  Warnings:

  - You are about to drop the column `identity_document` on the `tenants` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "admins" ADD COLUMN     "identity_document_bucket" TEXT,
ADD COLUMN     "profile_image_bucket" TEXT;

-- AlterTable
ALTER TABLE "tenants" DROP COLUMN "identity_document",
ADD COLUMN     "profile_image_bucket" TEXT;
