-- Create profiles table (utilisateurs)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  referral_code TEXT UNIQUE,
  referred_by_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  balance_commission NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for referral_code lookups
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON profiles(referred_by_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);