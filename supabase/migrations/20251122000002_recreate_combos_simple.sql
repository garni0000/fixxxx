-- Migration: Système de combos simplifié (image = source principale)
-- Date: 2025-11-22
-- Description: Un combo = une image de coupon avec infos globales

-- Suppression complète de l'ancien système
DROP TABLE IF EXISTS combo_pronos CASCADE;
DROP TABLE IF EXISTS combos CASCADE;
DROP FUNCTION IF EXISTS update_combos_updated_at() CASCADE;

-- Table combos (simplifiée - tout dans l'image)
CREATE TABLE combos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Informations principales
  title VARCHAR(255) NOT NULL,
  description TEXT,
  coupon_code VARCHAR(100), -- Code à copier-coller chez le bookmaker (optionnel)
  
  -- Image du coupon (contient tous les matchs visuellement)
  coupon_image_url TEXT NOT NULL,
  
  -- Informations financières
  global_odds DECIMAL(10, 2) NOT NULL,
  stake DECIMAL(10, 2) NOT NULL DEFAULT 10.00,
  potential_win DECIMAL(10, 2) NOT NULL,
  
  -- Statut et accès
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost')),
  access_tier VARCHAR(20) NOT NULL DEFAULT 'free' CHECK (access_tier IN ('free', 'basic', 'pro', 'vip')),
  
  -- Dates
  match_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX idx_combos_status ON combos(status);
CREATE INDEX idx_combos_access_tier ON combos(access_tier);
CREATE INDEX idx_combos_match_date ON combos(match_date DESC);
CREATE INDEX idx_combos_created_at ON combos(created_at DESC);

-- Trigger pour updated_at
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

-- Désactiver RLS pour débogage (à sécuriser plus tard)
ALTER TABLE combos DISABLE ROW LEVEL SECURITY;

-- Commentaires pour documentation
COMMENT ON TABLE combos IS 'Combos de paris - l''image du coupon contient tous les matchs';
COMMENT ON COLUMN combos.coupon_image_url IS 'URL de l''image du coupon contenant tous les matchs';
COMMENT ON COLUMN combos.coupon_code IS 'Code optionnel à copier-coller chez le bookmaker';
COMMENT ON COLUMN combos.global_odds IS 'Cote totale du combo (produit des cotes)';
COMMENT ON COLUMN combos.stake IS 'Mise suggérée en euros';
COMMENT ON COLUMN combos.potential_win IS 'Gain potentiel = stake × global_odds';
