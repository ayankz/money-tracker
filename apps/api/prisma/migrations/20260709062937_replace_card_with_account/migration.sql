/*
  Warnings:

  - You are about to drop the column `cardId` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the `cards` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "cards" DROP CONSTRAINT "cards_userId_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_cardId_fkey";

-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "cardId",
ADD COLUMN     "accountId" INTEGER;

-- DropTable
DROP TABLE "cards";

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
