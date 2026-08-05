-- CreateEnum
CREATE TYPE "ReminderType" AS ENUM ('VYMENA_OLEJE', 'STK', 'EMISE', 'POJISTENI', 'VYMENA_PNEUMATIK', 'VLASTNI');

-- CreateTable
CREATE TABLE "Reminder" (
    "id" TEXT NOT NULL,
    "type" "ReminderType" NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "dueDate" TIMESTAMP(3),
    "dueMileage" INTEGER,
    "emailAlert" BOOLEAN NOT NULL DEFAULT true,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "carId" TEXT NOT NULL,

    CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE CASCADE ON UPDATE CASCADE;
