-- Create enum for access tier (subscription level required to view prono)
CREATE TYPE public.access_tier AS ENUM ('free', 'basic', 'pro', 'vip');

-- Add access_tier column to pronos table
ALTER TABLE public.pronos 
ADD COLUMN access_tier public.access_tier NOT NULL DEFAULT 'free';

-- Add comment to explain the difference between prono_type and access_tier
COMMENT ON COLUMN public.pronos.prono_type IS 'Bet risk category: safe (low risk), risk (high risk), vip (exclusive)';
COMMENT ON COLUMN public.pronos.access_tier IS 'Subscription level required to view this prono: free, basic, pro, or vip';
