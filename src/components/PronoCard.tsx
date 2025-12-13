import { Link } from 'react-router-dom';
import { TrendingUp, Shield, Zap, CheckCircle2, XCircle, Lock, ChevronRight } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { getPronoTier, TIER_LABELS, TIER_COLORS } from '@/lib/tier-utils';
import { supabasePronosService } from '@/lib/supabase-services';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';

interface PronoCardProps {
  prono: any;
  isLocked?: boolean;
  showAdminActions?: boolean;
}

const PronoCard = ({ prono, isLocked = false, showAdminActions = false }: PronoCardProps) => {
  const { toast } = useToast();
  
  const pronoTier = prono.access_tier || 'free';
  
  const typeConfig: Record<string, { icon: any; label: string; color: string }> = {
    free: { icon: Shield, label: 'FREE', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    basic: { icon: Zap, label: 'BASIC', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    pro: { icon: TrendingUp, label: 'PRO', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
    vip: { icon: TrendingUp, label: 'VIP', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  };

  const config = typeConfig[pronoTier] || typeConfig.free;
  const Icon = config.icon;
  const status = prono.result || 'pending';

  const handleUpdateResult = async (result: 'won' | 'lost') => {
    try {
      await supabasePronosService.updatePronoResult(prono.id, result);
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

  const matchTime = prono.match_time ? new Date(prono.match_time).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  }) : '';

  return (
    <div 
      className={`bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4 hover:border-primary/30 transition-all duration-200 ${isLocked ? 'relative overflow-hidden' : ''}`}
      data-testid={`card-prono-${prono.id}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon size={18} className="text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${config.color}`}>
              {config.label}
            </Badge>
            {matchTime && (
              <span className="text-[11px] text-muted-foreground">{matchTime}</span>
            )}
            {status !== 'pending' && (
              <Badge 
                variant="outline" 
                className={`text-[10px] px-1.5 py-0 h-5 ${
                  status === 'won' 
                    ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                    : 'bg-red-500/20 text-red-400 border-red-500/30'
                }`}
              >
                {status === 'won' ? 'GAGNÉ' : 'PERDU'}
              </Badge>
            )}
          </div>
          
          <h3 className={`text-sm font-bold text-foreground leading-tight mb-0.5 ${isLocked ? 'blur-sm select-none' : ''}`} data-testid={`text-match-${prono.id}`}>
            {prono.home_team} vs {prono.away_team}
          </h3>
          
          {isLocked ? (
            <div className="blur-sm select-none">
              <p className="text-sm font-semibold text-primary mb-1">
                ●●●●●●●●
              </p>
            </div>
          ) : (
            <p className="text-sm font-semibold text-primary mb-1" data-testid={`text-prediction-${prono.id}`}>
              {prono.tip}
            </p>
          )}
          
          <p className={`text-xs text-muted-foreground truncate ${isLocked ? 'blur-sm select-none' : ''}`} data-testid={`text-league-${prono.id}`}>
            {prono.competition}
          </p>

          {!isLocked && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div 
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full ${
                      i <= prono.confidence ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="text-right">
            <span className="text-[10px] text-muted-foreground block">Cote</span>
            <span className="text-lg font-bold text-primary" data-testid={`text-odd-${prono.id}`}>
              {prono.odd?.toFixed(2) || 'N/A'}
            </span>
          </div>
          {!isLocked && (
            <Link 
              to={`/pronos/${prono.id}`}
              className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
            >
              <ChevronRight size={14} className="text-primary" />
            </Link>
          )}
        </div>
      </div>

      {isLocked && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <Link to="/pricing">
            <Button 
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold h-9"
              size="sm"
            >
              <Lock size={14} className="mr-2" />
              Débloquer ce prono
            </Button>
          </Link>
        </div>
      )}

      {showAdminActions && !isLocked && status === 'pending' && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-border/50">
          <Button
            size="sm"
            className="flex-1 h-8 text-xs"
            variant="default"
            onClick={() => handleUpdateResult('won')}
            data-testid={`button-mark-won-${prono.id}`}
          >
            <CheckCircle2 size={14} className="mr-1" />
            Gagné
          </Button>
          <Button
            size="sm"
            className="flex-1 h-8 text-xs"
            variant="destructive"
            onClick={() => handleUpdateResult('lost')}
            data-testid={`button-mark-lost-${prono.id}`}
          >
            <XCircle size={14} className="mr-1" />
            Perdu
          </Button>
        </div>
      )}
    </div>
  );
};

export default PronoCard;
