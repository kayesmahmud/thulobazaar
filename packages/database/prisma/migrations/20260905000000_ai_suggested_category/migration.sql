-- Seller-facing category suggestion for AI-held ads.
-- Additive and nullable: existing rows keep NULL, which every client already
-- treats as "no suggestion" and simply omits from the hold message.
ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "ai_suggested_category" VARCHAR(80);
