-- Additive only. Do not run db push --accept-data-loss.
ALTER TYPE "ConversationChannel" ADD VALUE IF NOT EXISTS 'FACEBOOK_MESSENGER';
