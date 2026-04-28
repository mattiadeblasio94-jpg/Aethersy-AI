-- Add Telegram and Stripe columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_id TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);

-- Comment explaining the columns
COMMENT ON COLUMN users.telegram_id IS 'Telegram user ID for bot integration';
COMMENT ON COLUMN users.stripe_subscription_id IS 'Stripe subscription ID for recurring billing';
COMMENT ON COLUMN users.stripe_customer_id IS 'Stripe customer ID for payment methods';
