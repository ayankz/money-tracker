ALTER TABLE "cards" ADD COLUMN "cardName" TEXT;

UPDATE "cards"
SET "cardName" = 'Card ' || "digits"
WHERE "cardName" IS NULL;

ALTER TABLE "cards" ALTER COLUMN "cardName" SET NOT NULL;
