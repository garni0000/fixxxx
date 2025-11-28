import { Link } from 'react-router-dom';
import { TrendingUp, Shield, Zap, CheckCircle2, XCircle, Lock } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { getPronoTier, TIER_LABELS, TIER_COLORS } from '@/lib/tier-utils';
import { supabasePronosService } from '@/lib/supabase-services';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';

interface PronoCardProps {
  prono: any; // Objet prono complet
  isLocked?: boolean; // Si true, affiche l'aperçu partiel
  showAdminActions?: boolean; // Si true, affiche les boutons pour marquer gagné/perdu (admin seulement)
}

const PronoCard = ({ prono, isLocked = false, showAdminActions = false }: PronoCardProps) => {
  const { toast } = useToast();
  
  // Obtenir le niveau d'accès requis
  const pronoTier = prono.access_tier || 'free';
  
  const typeConfig: Record<string, { icon: any; label: string; color: string }> = {
    free: { icon: Shield, label: TIER_LABELS.free, color: TIER_COLORS.free },
    basic: { icon: Zap, label: TIER_LABELS.basic, color: TIER_COLORS.basic },
    pro: { icon: TrendingUp, label: TIER_LABELS.pro, color: TIER_COLORS.pro },
    vip: { icon: TrendingUp, label: TIER_LABELS.vip, color: TIER_COLORS.vip },
  };

  const config = typeConfig[pronoTier] || typeConfig.free;
  const Icon = config.icon;

  // Déterminer le statut du résultat
  const status = prono.result || 'pending';

  const handleUpdateResult = async (result: 'won' | 'lost') => {
    try {
      await supabasePronosService.updatePronoResult(prono.id, result);
      
      // Invalider le cache pour rafraîchir les données
      queryClient.invalidateQueries({ queryKey: ['/api/pronos'] });
      
      toast({
        title: 'Résultat mis à jour',
        description: `Le prono a été marqué comme ${result === 'won' ? 'GAGNÉ' : 'PERDU'}`,
      });
    } catch (error) {
      console.error('Error updating prono result:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le résultat',
        variant: 'destructive',
      });
    }
  };

  return (
    <div 
      className={`card-premium p-6 hover:scale-[1.02] transition-transform duration-300 ${isLocked ? 'relative' : ''}`}
      data-testid={`card-prono-${prono.id}`}
    >
      {/* Header: Équipes + Badge Type */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-foreground mb-1" data-testid={`text-match-${prono.id}`}>
            {prono.home_team} vs {prono.away_team}
          </h3>
          <p className="text-sm text-muted-foreground" data-testid={`text-league-${prono.id}`}>
            {prono.competition}
          </p>
        </div>
        <Badge className={`${config.color} flex items-center gap-1`} data-testid={`badge-type-${prono.id}`}>
          <Icon size={14} />
          {config.label}
        </Badge>
      </div>

      {/* Contenu */}
      <div className="space-y-3 mb-4">
        {/* Cote - TOUJOURS visible */}
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Cote</span>
          <span className="text-primary font-bold text-lg" data-testid={`text-odd-${prono.id}`}>
            {prono.odd?.toFixed(2) || 'N/A'}
          </span>
        </div>

        {/* Contenu verrouillé ou déverrouillé */}
        {isLocked ? (
          <>
            {/* Aperçu partiel - Contenu masqué */}
            <div className="flex justify-between items-center opacity-50">
              <span className="text-muted-foreground">Pronostic</span>
              <div className="flex items-center gap-2">
                <Lock size={16} className="text-muted-foreground" />
                <span className="text-muted-foreground">Verrouillé</span>
              </div>
            </div>

            <div className="flex justify-between items-center opacity-50">
              <span className="text-muted-foreground">Confiance</span>
              <div className="flex items-center gap-2">
                <Lock size={16} className="text-muted-foreground" />
                <span className="text-muted-foreground">Verrouillé</span>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Contenu complet */}
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Pronostic</span>
              <span className="text-foreground font-semibold" data-testid={`text-prediction-${prono.id}`}>
                {prono.content || prono.tip}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Confiance</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full vip-gradient rounded-full transition-all duration-500"
                    style={{ width: `${(prono.confidence / 5) * 100}%` }}
                  />
                </div>
                <span className="text-primary font-bold" data-testid={`text-confidence-${prono.id}`}>
                  {prono.confidence}/5
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Résultat du prono (si disponible) */}
      {status !== 'pending' && !isLocked && (
        <div className={`flex items-center gap-2 mb-4 p-3 rounded-lg ${
          status === 'won' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
        }`}>
          {status === 'won' ? (
            <>
              <CheckCircle2 size={20} />
              <span className="font-semibold" data-testid={`status-won-${prono.id}`}>GAGNÉ</span>
              {prono.result && <span className="ml-auto">{prono.result}</span>}
            </>
          ) : (
            <>
              <XCircle size={20} />
              <span className="font-semibold" data-testid={`status-lost-${prono.id}`}>PERDU</span>
              {prono.result && <span className="ml-auto">{prono.result}</span>}
            </>
          )}
        </div>
      )}

      {/* Boutons admin pour marquer le résultat */}
      {showAdminActions && !isLocked && status === 'pending' && (
        <div className="flex gap-2 mb-3">
          <Button
            className="flex-1"
            variant="default"
            onClick={() => handleUpdateResult('won')}
            data-testid={`button-mark-won-${prono.id}`}
          >
            <CheckCircle2 size={16} className="mr-2" />
            Gagné
          </Button>
          <Button
            className="flex-1"
            variant="destructive"
            onClick={() => handleUpdateResult('lost')}
            data-testid={`button-mark-lost-${prono.id}`}
          >
            <XCircle size={16} className="mr-2" />
            Perdu
          </Button>
        </div>
      )}

      {/* Bouton d'action */}
      {isLocked ? (
        <Link to="/pricing">
          <Button className="w-full" variant="default" data-testid={`button-unlock-${prono.id}`}>
            <Lock size={16} className="mr-2" />
            Débloquer ce prono
          </Button>
        </Link>
      ) : (
        <Link to={`/pronos/${prono.id}`}>
          <Button className="w-full" variant="outline" data-testid={`button-details-${prono.id}`}>
            Voir l'analyse complète
          </Button>
        </Link>
      )}
    </div>
  );
};

export default PronoCard;
