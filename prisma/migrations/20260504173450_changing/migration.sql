/*
  Warnings:

  - The values [APARTMENT] on the enum `ListingType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ListingType_new" AS ENUM ('HOUSE', 'VILLA', 'CABIN');
ALTER TABLE "Listing" ALTER COLUMN "type" TYPE "ListingType_new" USING ("type"::text::"ListingType_new");
ALTER TYPE "ListingType" RENAME TO "ListingType_old";
ALTER TYPE "ListingType_new" RENAME TO "ListingType";
DROP TYPE "public"."ListingType_old";
COMMIT;
