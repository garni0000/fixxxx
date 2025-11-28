/**
 * Utilitaires pour gérer la hiérarchie des tiers d'accès aux pronos
 * Système à 4 niveaux : FREE < BASIC < PRO < VIP
 */

export type PronoTier = 'free' | 'basic' | 'pro' | 'vip';
export type UserTier = 'free' | 'basic' | 'pro' | 'vip';

// Mapping de hiérarchie : plus le nombre est élevé, plus le niveau est haut
const TIER_LEVELS: Record<PronoTier, number> = {
  free: 0,
  basic: 1,
  pro: 2,
  vip: 3,
};

// Labels pour l'affichage
export const TIER_LABELS: Record<PronoTier, string> = {
  free: 'GRATUIT',
  basic: 'BASIC',
  pro: 'PRO',
  vip: 'VIP',
};

// Couleurs pour les badges
export const TIER_COLORS: Record<PronoTier, string> = {
  free: 'text-success',
  basic: 'text-blue-400',
  pro: 'text-purple-400',
  vip: 'text-primary',
};

/**
 * Normalise un type de prono (gère les anciens types safe/risk)
 */
export function getPronoTier(pronoType: string | undefined | null): PronoTier {
  if (!pronoType) return 'free';
  
  const normalized = pronoType.toLowerCase();
  
  // Anciens types convertis en FREE
  if (normalized === 'safe' || normalized === 'risk') {
    return 'free';
  }
  
  // Vérifier que c'est un tier valide
  if (['free', 'basic', 'pro', 'vip'].includes(normalized)) {
    return normalized as PronoTier;
  }
  
  // Par défaut, considérer comme gratuit
  return 'free';
}

/**
 * Obtient le tier d'un utilisateur basé sur son abonnement
 */
export function getUserTier(subscription: any): UserTier {
  // Si pas d'abonnement ou abonnement inactif → FREE
  if (!subscription || subscription.status !== 'active') {
    return 'free';
  }
  
  const plan = subscription.plan?.toLowerCase();
  
  // Vérifier que c'est un plan valide
  if (['basic', 'pro', 'vip'].includes(plan)) {
    return plan as UserTier;
  }
  
  // Par défaut FREE
  return 'free';
}

/**
 * Vérifie si un utilisateur a accès à un prono
 * Retourne true si le tier de l'utilisateur >= tier du prono
 */
export function canAccessProno(userTier: UserTier, pronoTier: PronoTier): boolean {
  return TIER_LEVELS[userTier] >= TIER_LEVELS[pronoTier];
}

/**
 * Résultat de la vérification d'accès avec métadonnées
 */
export interface PronoAccessResult {
  canAccess: boolean;
  isLocked: boolean;
  requiredTier: PronoTier;
  userTier: UserTier;
  unlockMessage: string;
  ctaText: string;
}

/**
 * Vérifie l'accès à un prono et retourne des métadonnées complètes
 */
export function checkPronoAccess(
  userTier: UserTier,
  pronoTier: PronoTier
): PronoAccessResult {
  const canAccess = canAccessProno(userTier, pronoTier);
  
  return {
    canAccess,
    isLocked: !canAccess,
    requiredTier: pronoTier,
    userTier,
    unlockMessage: canAccess
      ? ''
      : `Ce pronostic est réservé aux abonnés ${TIER_LABELS[pronoTier]}`,
    ctaText: canAccess ? '' : `Passer à ${TIER_LABELS[pronoTier]}`,
  };
}

/**
 * Obtient tous les tiers accessibles pour un utilisateur
 */
export function getAccessibleTiers(userTier: UserTier): PronoTier[] {
  const userLevel = TIER_LEVELS[userTier];
  return Object.entries(TIER_LEVELS)
    .filter(([, level]) => level <= userLevel)
    .map(([tier]) => tier as PronoTier);
}

/**
 * Vérifie si un prono doit afficher un aperçu partiel
 */
export function shouldShowPartialPreview(
  userTier: UserTier,
  pronoTier: PronoTier
): boolean {
  return !canAccessProno(userTier, pronoTier);
}
