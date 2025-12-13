-- Create combos table (paris combinés)
CREATE TABLE IF NOT EXISTS combos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  coupon_image_url TEXT,
  global_odds NUMERIC,
  stake NUMERIC,
  potential_win NUMERIC,
  status VARCHAR(20) DEFAULT 'draft',
  access_tier VARCHAR(10),
  match_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create combo_pronos table (liaison combos-pronos)
CREATE TABLE IF NOT EXISTS combo_pronos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  combo_id UUID NOT NULL REFERENCES combos(id) ON DELETE CASCADE,
  prono_id TEXT NOT NULL REFERENCES pronos(id) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 0,
  UNIQUE(combo_id, prono_id)
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_combos_access ON combos(access_tier);
CREATE INDEX IF NOT EXISTS idx_combos_status ON combos(status);
CREATE INDEX IF NOT EXISTS idx_combo_pronos_combo ON combo_pronos(combo_id);
CREATE INDEX IF NOT EXISTS idx_combo_pronos_prono ON combo_pronos(prono_id);