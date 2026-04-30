/*
  Warnings:

  - Added the required column `checkIn` to the `Bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `checkOut` to the `Bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `guestId` to the `Bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `listingId` to the `Bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `Bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalPrice` to the `Bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `Listings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `guest` to the `Listings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hostId` to the `Listings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `location` to the `Listings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pricePerNight` to the `Listings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ratings` to the `Listings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Listings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Listings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Listings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `avatar` to the `Users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bio` to the `Users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone` to the `Users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Bookings" ADD COLUMN     "checkIn" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "checkOut" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "guestId" INTEGER NOT NULL,
ADD COLUMN     "listingId" INTEGER NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL,
ADD COLUMN     "totalPrice" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "Listings" ADD COLUMN     "amenties" TEXT[],
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "guest" INTEGER NOT NULL,
ADD COLUMN     "hostId" INTEGER NOT NULL,
ADD COLUMN     "location" TEXT NOT NULL,
ADD COLUMN     "pricePerNight" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "ratings" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL,
ADD COLUMN     "type" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "avatar" TEXT NOT NULL,
ADD COLUMN     "bio" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "phone" TEXT NOT NULL,
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'Guest';
