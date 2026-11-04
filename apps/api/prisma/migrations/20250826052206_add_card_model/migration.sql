/*
  Warnings:

  - Added the required column `type` to the `cards` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CardType" AS ENUM ('VISA', 'MC');

-- AlterTable
ALTER TABLE "cards" ADD COLUMN     "type" "CardType" NOT NULL;
