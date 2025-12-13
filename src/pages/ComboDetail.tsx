import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BottomNav from '@/components/BottomNav';
import { supabaseComboService } from '@/lib/supabase-services';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { ArrowLeft, Calendar, Lock, Trophy, CheckCircle2, XCircle, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const TIER_LABELS = {
  free: 'GRATUIT',
  basic: 'BASIC',
  pro: 'PRO',
  vip: 'VIP'
};

const TIER_COLORS = {
  free: 'bg-green-500/10 text-green-500 border-green-500/20',
  basic: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  pro: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  vip: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
};

export default function ComboDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useSupabaseAuth();
  const [combo, setCombo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadCombo();
    }
  }, [id]);

  const loadCombo = async () => {
    try {
      const { data } = await supabaseComboService.getComboById(id!);
      setCombo(data);
    } catch (error) {
      console.error('Error loading combo:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="text-center py-12">Chargement...</div>
        </main>
        <Footer />
        <BottomNav />
      </div>
    );
  }

  if (!combo) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">Combo introuvable</p>
              <Button onClick={() => navigate('/combos')} data-testid="button-back-to-combos">
                Retour aux combos
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
        <BottomNav />
      </div>
    );
  }

  const userTier = user?.subscription?.plan || 'free';
  const tierHierarchy = { free: 0, basic: 1, pro: 2, vip: 3 };
  const hasAccess = tierHierarchy[userTier as keyof typeof tierHierarchy] >= 
                     tierHierarchy[combo.access_tier as keyof typeof tierHierarchy];

  const getStatusBadge = () => {
    switch (combo.status) {
      case 'won':
        return (
          <Badge variant="default" className="gap-1">
            <Trophy className="h-3 w-3" />
            Gagné
          </Badge>
        );
      case 'lost':
        return <Badge variant="destructive">Perdu</Badge>;
      default:
        return <Badge variant="secondary">En cours</Badge>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <Link to="/combos">
          <Button variant="ghost" className="mb-6" data-testid="button-back">
            <ArrowLeft className="mr-2" size={16} />
            Retour aux combos
          </Button>
        </Link>

        <div className="max-w-4xl mx-auto">
          {combo.coupon_image_url && (
            <Card className="mb-6 overflow-hidden relative">
              <img
                src={combo.coupon_image_url}
                alt={combo.title}
                className={`w-full object-cover max-h-96 ${!hasAccess ? 'blur-md' : ''}`}
                data-testid="img-coupon"
              />
              {!hasAccess && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="text-center text-white">
                    <Lock className="h-12 w-12 mx-auto mb-2" />
                    <p className="text-lg font-semibold">Image de coupon verrouillée</p>
                    <p className="text-sm opacity-80">Passez à {TIER_LABELS[combo.access_tier as keyof typeof TIER_LABELS]} pour voir le détail</p>
                  </div>
                </div>
              )}
            </Card>
          )}

          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex-1">
                  <CardTitle className="text-3xl mb-2">{combo.title}</CardTitle>
                  {combo.description && (
                    <CardDescription className="text-base">{combo.description}</CardDescription>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  {getStatusBadge()}
                  <Badge className={TIER_COLORS[combo.access_tier as keyof typeof TIER_COLORS]}>
                    {TIER_LABELS[combo.access_tier as keyof typeof TIER_LABELS]}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground pt-4 border-t">
                <Calendar className="h-4 w-4" />
                {format(new Date(combo.match_date), 'dd MMMM yyyy', { locale: fr })}
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-3 gap-4 p-6 bg-secondary/30 rounded-lg">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-1">Cote globale</div>
                  <div className="text-2xl font-bold text-primary">{combo.global_odds}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-1">Mise recommandée</div>
                  <div className="text-xl font-semibold">{combo.stake || 0}€</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-1">Gain potentiel</div>
                  <div className="text-xl font-semibold text-green-500">{combo.potential_win || 0}€</div>
                </div>
              </div>

              {/* Section Code Coupon - Toujours visible mais verrouillée si pas d'accès */}
              {combo.coupon_code ? (
                <div className="mt-6 p-6 bg-secondary/30 rounded-lg border border-border">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Code Coupon
                      </div>
                      {hasAccess ? (
                        <div className="text-xl font-mono font-bold text-primary select-all">
                          {combo.coupon_code}
                        </div>
                      ) : (
                        <div className="text-xl font-mono blur-sm select-none">
                          XXXX-XXXX-XXXX
                        </div>
                      )}
                    </div>
                    {!hasAccess && (
                      <Button 
                        size="lg"
                        onClick={() => navigate(`/pricing?plan=${combo.access_tier}`)}
                        className="gap-2"
                        data-testid="button-unlock-coupon"
                      >
                        <TrendingUp className="h-5 w-5" />
                        Débloquer {TIER_LABELS[combo.access_tier as keyof typeof TIER_LABELS]}
                      </Button>
                    )}
                  </div>
                  {!hasAccess && (
                    <p className="text-sm text-muted-foreground mt-4 text-center">
                      ⚡ Passez à {TIER_LABELS[combo.access_tier as keyof typeof TIER_LABELS]} pour copier ce code et placer votre pari !
                    </p>
                  )}
                </div>
              ) : null}
            </CardContent>
          </Card>

          {combo.pronos && combo.pronos.length > 0 ? (
            <div>
              <h2 className="text-2xl font-bold mb-4">
                Pronos du combo ({combo.pronos.length})
              </h2>
              <div className="space-y-4">
                {combo.pronos.map((prono: any, index: number) => (
                  <Card 
                    key={prono.id} 
                    className="hover-elevate cursor-pointer"
                    onClick={() => navigate(`/pronos/${prono.id}`)}
                    data-testid={`card-prono-${index}`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-1">
                            {prono.home_team} vs {prono.away_team}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <Trophy size={14} />
                            {prono.competition}
                          </CardDescription>
                        </div>
                        {prono.prono_result && prono.prono_result !== 'pending' && (
                          <Badge variant={prono.prono_result === 'won' ? 'default' : 'destructive'}>
                            {prono.prono_result === 'won' ? (
                              <>
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Gagné
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3 w-3 mr-1" />
                                Perdu
                              </>
                            )}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Pronostic</div>
                          <div className="font-semibold">{prono.content}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Cote</div>
                          <div className="text-lg font-bold text-primary">{prono.odd}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Date</div>
                          <div className="text-sm">
                            {format(new Date(prono.match_date), 'dd/MM/yyyy', { locale: fr })}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Aucun prono lié à ce combo
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
}
