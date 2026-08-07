-- CreateEnum
CREATE TYPE "ShareRole" AS ENUM ('SPOLUMAJITEL', 'SERVIS');

-- CreateTable
CREATE TABLE "CarShare" (
    "id" TEXT NOT NULL,
    "role" "ShareRole" NOT NULL DEFAULT 'SPOLUMAJITEL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "carId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "CarShare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CarShare_carId_userId_key" ON "CarShare"("carId", "userId");

-- AddForeignKey
ALTER TABLE "CarShare" ADD CONSTRAINT "CarShare_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarShare" ADD CONSTRAINT "CarShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
