/*
  Warnings:

  - A unique constraint covering the columns `[identity_no]` on the table `admins` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "UserGender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "IdentityType" AS ENUM ('PASSPORT', 'NATIONAL_ID', 'DRIVING_LICENSE');

-- CreateEnum
CREATE TYPE "BloodGroup" AS ENUM ('A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE');

-- CreateEnum
CREATE TYPE "EmergencyContactRelation" AS ENUM ('FATHER', 'MOTHER', 'SPOUSE', 'BROTHER', 'SISTER', 'SON', 'DAUGHTER', 'OTHER');

-- AlterTable
ALTER TABLE "admins" ADD COLUMN     "blood_group" "BloodGroup",
ADD COLUMN     "date_of_birth" TIMESTAMP(3),
ADD COLUMN     "emergency_contact_mobile" TEXT,
ADD COLUMN     "emergency_contact_name" TEXT,
ADD COLUMN     "emergency_contact_relation" "EmergencyContactRelation",
ADD COLUMN     "gender" "UserGender",
ADD COLUMN     "identity_no" TEXT,
ADD COLUMN     "identity_type" "IdentityType";

-- CreateIndex
CREATE UNIQUE INDEX "admins_identity_no_key" ON "admins"("identity_no");
