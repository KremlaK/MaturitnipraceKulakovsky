-- AlterTable
ALTER TABLE "FuelRecord" ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "placeName" TEXT;

-- AlterTable
ALTER TABLE "ServiceRecord" ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "placeName" TEXT;
