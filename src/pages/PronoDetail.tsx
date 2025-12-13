import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Trophy, TrendingUp, Shield, Zap, CheckCircle2, XCircle, Lock } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BottomNav from '@/components/BottomNav';
import { useProno } from '@/hooks/usePronos';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { Card } from '@/components/ui/card';
import { getUserTier, canAccessProno, TIER_LABELS, TIER_COLORS } from '@/lib/tier-utils';

const PronoDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: prono, isLoading } = useProno(id || '');
  const { user } = useSupabaseAuth();

  const typeConfig = {
    free: { icon: Shield, label: TIER_LABELS.free, color: TIER_COLORS.free },
    basic: { icon: Zap, label: TIER_LABELS.basic, color: TIER_COLORS.basic },
    pro: { icon: TrendingUp, label: TIER_LABELS.pro, color: TIER_COLORS.pro },
    vip: { icon: TrendingUp, label: TIER_LABELS.vip, color: TIER_COLORS.vip },
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="card-premium p-8 animate-pulse">
            <div className="h-8 bg-muted rounded mb-4" />
            <div className="h-4 bg-muted rounded mb-2" />
            <div className="h-4 bg-muted rounded w-2/3" />
          </div>
        </main>
        <Footer />
        <BottomNav />
      </div>
    );
  }

  if (!prono) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <p className="text-center text-2xl text-muted-foreground">Prono non trouvé</p>
        </main>
        <Footer />
        <BottomNav />
      </div>
    );
  }

  // Obtenir le tier de l'utilisateur et du prono
  const userTier = getUserTier(user?.subscription);
  const pronoTier = prono.access_tier || 'free';
  const isLocked = !canAccessProno(userTier, pronoTier);

  // Si le prono est verrouillé, afficher le message de verrouillage
  if (isLocked) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Link to="/pronos/today">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="mr-2" size={16} />
              Retour aux pronos
            </Button>
          </Link>

          <Card className="max-w-2xl mx-auto p-12 text-center bg-primary/5 border-primary/20">
            <Lock className="h-16 w-16 text-primary mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">Contenu Réservé {TIER_LABELS[pronoTier]}</h2>
            <p className="text-muted-foreground mb-8 text-lg">
              Ce pronostic est réservé aux abonnés {TIER_LABELS[pronoTier]}. 
              Abonnez-vous pour accéder à tous nos pronos premium et maximiser vos gains.
            </p>
            
            {/* Aperçu partiel */}
            <div className="mb-8 p-6 bg-card rounded-lg text-left max-w-md mx-auto">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Match</span>
                  <span className="font-semibold">{prono.home_team} vs {prono.away_team}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Compétition</span>
                  <span className="font-semibold">{prono.competition}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Cote</span>
                  <span className="text-primary font-bold text-lg">{prono.odd?.toFixed(2) || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center opacity-50">
                  <span className="text-muted-foreground">Pronostic</span>
                  <div className="flex items-center gap-2">
                    <Lock size={16} />
                    <span>Verrouillé</span>
                  </div>
                </div>
                <div className="flex justify-between items-center opacity-50">
                  <span className="text-muted-foreground">Analyse</span>
                  <div className="flex items-center gap-2">
                    <Lock size={16} />
                    <span>Verrouillée</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4 justify-center flex-wrap">
              <Link to="/pricing">
                <Button size="lg" variant="default" data-testid="button-upgrade-detail">
                  Passer à {TIER_LABELS[pronoTier]}
                </Button>
              </Link>
              <Link to="/pronos/today">
                <Button size="lg" variant="outline">
                  Voir les pronos gratuits
                </Button>
              </Link>
            </div>
          </Card>
        </main>
        <Footer />
        <BottomNav />
      </div>
    );
  }

  // Utiliser le tier pour l'icône
  const Icon = typeConfig[pronoTier as keyof typeof typeConfig]?.icon || Shield;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <Link to="/pronos/today">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2" size={16} />
            Retour aux pronos
          </Button>
        </Link>

        <div className="card-premium p-8 max-w-4xl mx-auto">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">{prono.home_team} vs {prono.away_team}</h1>
              <p className="text-muted-foreground flex items-center gap-2">
                <Trophy size={16} />
                {prono.competition}
              </p>
            </div>
            <Badge className={`${typeConfig[pronoTier as keyof typeof typeConfig]?.color || 'text-primary'} flex items-center gap-1`}>
              <Icon size={14} />
              {typeConfig[pronoTier as keyof typeof typeConfig]?.label || 'PRONO'}
            </Badge>
          </div>

          {prono.prono_result && prono.prono_result !== 'pending' && (
            <div className={`flex items-center gap-2 mb-6 p-4 rounded-lg ${
              prono.prono_result === 'won' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
            }`}>
              {prono.prono_result === 'won' ? (
                <>
                  <CheckCircle2 size={24} />
                  <div className="flex-1">
                    <span className="font-bold text-lg">PRONOSTIC GAGNÉ !</span>
                    {prono.result && <span className="ml-4">Score final: {prono.result}</span>}
                  </div>
                </>
              ) : (
                <>
                  <XCircle size={24} />
                  <div className="flex-1">
                    <span className="font-bold text-lg">Pronostic perdu</span>
                    {prono.result && <span className="ml-4">Score final: {prono.result}</span>}
                  </div>
                </>
              )}
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-secondary/50 p-6 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Pronostic</p>
              <p className="text-xl font-bold">{prono.content}</p>
            </div>
            
            <div className="bg-secondary/50 p-6 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Cote</p>
              <p className="text-xl font-bold text-primary">{prono.odd?.toFixed(2) || 'N/A'}</p>
            </div>

            <div className="bg-secondary/50 p-6 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Confiance</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full vip-gradient rounded-full transition-all duration-500"
                    style={{ width: `${(prono.confidence / 5) * 100}%` }}
                  />
                </div>
                <span className="text-xl font-bold text-primary">{prono.confidence}/5</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Analyse complète</h2>
              <p className="text-muted-foreground leading-relaxed">{prono.analysis}</p>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                <TrendingUp className="text-primary" />
                Points clés
              </h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Match prévu le {new Date(prono.match_time || prono.created_at).toLocaleDateString('fr-FR')}</li>
                <li>• Analyse basée sur les performances récentes des équipes</li>
                <li>• Statistiques historiques prises en compte</li>
                <li>• Conditions de jeu optimales analysées</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
};

export default PronoDetail;
