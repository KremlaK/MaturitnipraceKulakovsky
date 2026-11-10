-- CreateEnum
CREATE TYPE "BodyType" AS ENUM ('HATCHBACK', 'SEDAN', 'KOMBI', 'SUV');

-- AlterTable
ALTER TABLE "Car" ADD COLUMN     "bodyType" "BodyType";

