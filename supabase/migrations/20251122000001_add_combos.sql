-- Migration pour ajouter le système de paris combinés
-- Date: 22 Novembre 2025

-- Table principale des combos
CREATE TABLE IF NOT EXISTS combos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  coupon_image_url TEXT, -- URL de l'image du coupon uploadée
  global_odds DECIMAL(10, 2) NOT NULL, -- Cote globale du combo
  stake DECIMAL(10, 2) DEFAULT 0, -- Mise recommandée
  potential_win DECIMAL(10, 2) DEFAULT 0, -- Gain potentiel
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost')),
  access_tier VARCHAR(20) NOT NULL DEFAULT 'free' CHECK (access_tier IN ('free', 'basic', 'pro', 'vip')),
  match_date TIMESTAMP WITH TIME ZONE NOT NULL, -- Date du premier match du combo
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table de liaison entre combos et pronos individuels
CREATE TABLE IF NOT EXISTS combo_pronos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  combo_id UUID NOT NULL REFERENCES combos(id) ON DELETE CASCADE,
  prono_id UUID NOT NULL REFERENCES pronos(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(combo_id, prono_id) -- Un prono ne peut être ajouté qu'une fois par combo
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_combos_status ON combos(status);
CREATE INDEX IF NOT EXISTS idx_combos_access_tier ON combos(access_tier);
CREATE INDEX IF NOT EXISTS idx_combos_match_date ON combos(match_date DESC);
CREATE INDEX IF NOT EXISTS idx_combo_pronos_combo_id ON combo_pronos(combo_id);
CREATE INDEX IF NOT EXISTS idx_combo_pronos_prono_id ON combo_pronos(prono_id);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_combos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER combos_updated_at_trigger
BEFORE UPDATE ON combos
FOR EACH ROW
EXECUTE FUNCTION update_combos_updated_at();

-- Row Level Security (RLS)
ALTER TABLE combos ENABLE ROW LEVEL SECURITY;
ALTER TABLE combo_pronos ENABLE ROW LEVEL SECURITY;

-- Politique: Tout le monde peut lire les combos (le filtrage par tier se fait côté app)
CREATE POLICY "Combos are viewable by everyone" ON combos
  FOR SELECT USING (true);

-- Politique: Seuls les admins peuvent créer/modifier/supprimer des combos
CREATE POLICY "Only admins can insert combos" ON combos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can update combos" ON combos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete combos" ON combos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Politique: Tout le monde peut lire les liaisons combo_pronos
CREATE POLICY "Combo pronos are viewable by everyone" ON combo_pronos
  FOR SELECT USING (true);

-- Politique: Seuls les admins peuvent gérer les liaisons
CREATE POLICY "Only admins can manage combo_pronos" ON combo_pronos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Commentaires pour documentation
COMMENT ON TABLE combos IS 'Paris combinés créés par les admins';
COMMENT ON COLUMN combos.global_odds IS 'Produit des cotes de tous les pronos du combo';
COMMENT ON COLUMN combos.coupon_image_url IS 'URL de l image du coupon uploadée dans Supabase Storage';
COMMENT ON COLUMN combos.access_tier IS 'Niveau d abonnement requis pour voir ce combo';
COMMENT ON TABLE combo_pronos IS 'Liaison many-to-many entre combos et pronos';
