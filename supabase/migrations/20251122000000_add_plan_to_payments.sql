-- Migration: Add plan column to payments table
-- Date: 2025-11-22
-- Description: Ajoute une colonne 'plan' pour indiquer quel plan d'abonnement est associé au paiement

-- Ajouter la colonne plan (non-nullable avec valeur par défaut)
ALTER TABLE public.payments 
ADD COLUMN plan public.subscription_plan NOT NULL DEFAULT 'basic';

-- Créer un index pour améliorer les performances des requêtes filtrées par plan
CREATE INDEX idx_payments_plan ON public.payments(plan);

-- Commentaire pour documentation
COMMENT ON COLUMN public.payments.plan IS 'Plan d''abonnement associé au paiement (basic, pro, vip)';
