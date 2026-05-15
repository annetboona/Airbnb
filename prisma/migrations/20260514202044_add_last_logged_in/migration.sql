-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastLoggedIn" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "HostRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HostRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HostRequest_userId_key" ON "HostRequest"("userId");

-- AddForeignKey
ALTER TABLE "HostRequest" ADD CONSTRAINT "HostRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
