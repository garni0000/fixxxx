import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabaseComboService } from '@/lib/supabase-services';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { Calendar, Lock, Trophy } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function Combos() {
  const navigate = useNavigate();
  const { user } = useSupabaseAuth();
  const [combos, setCombos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCombos();
  }, []);

  const loadCombos = async () => {
    try {
      const { data } = await supabaseComboService.getCombos();
      
      // ✅ NOUVEAU : Afficher TOUS les combos (teasing marketing)
      // Les combos premium seront verrouillés dans la page de détail
      setCombos(data || []);
    } catch (error) {
      console.error('Error loading combos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComboClick = (combo: any) => {
    navigate(`/combos/${combo.id}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'won': return 'default';
      case 'lost': return 'destructive';
      default: return 'secondary';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'vip': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'pro': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'basic': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default: return 'bg-green-500/10 text-green-500 border-green-500/20';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Paris Combinés</h1>
          <p className="text-muted-foreground">Découvrez nos meilleurs paris combinés</p>
        </div>

        {loading ? (
          <div className="text-center py-12">Chargement...</div>
        ) : combos.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Aucun combo disponible pour le moment
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {combos.map((combo) => (
              <Card
                key={combo.id}
                className="cursor-pointer hover-elevate active-elevate-2 overflow-hidden"
                onClick={() => handleComboClick(combo)}
                data-testid={`card-combo-${combo.id}`}
              >
                {combo.coupon_image_url && (
                  <div className="relative aspect-video w-full overflow-hidden bg-muted">
                    <img
                      src={combo.coupon_image_url}
                      alt={combo.title}
                      className="object-cover w-full h-full"
                    />
                  </div>
                )}
                
                <CardHeader>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <CardTitle className="text-lg line-clamp-2">{combo.title}</CardTitle>
                    <Badge variant={getStatusColor(combo.status)}>
                      {combo.status === 'won' && <Trophy className="h-3 w-3 mr-1" />}
                      {combo.status === 'won' && 'Gagné'}
                      {combo.status === 'lost' && 'Perdu'}
                      {combo.status === 'pending' && 'En cours'}
                    </Badge>
                  </div>
                  
                  <CardDescription className="line-clamp-2">
                    {combo.description || 'Combo de pronos sélectionnés'}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(combo.match_date), 'dd MMM yyyy', { locale: fr })}
                    </div>
                    <Badge className={getTierColor(combo.access_tier)}>
                      {combo.access_tier === 'free' && '🌟 GRATUIT'}
                      {combo.access_tier === 'basic' && <Lock className="h-3 w-3 mr-1" />}
                      {combo.access_tier === 'pro' && <Lock className="h-3 w-3 mr-1" />}
                      {combo.access_tier === 'vip' && <Lock className="h-3 w-3 mr-1" />}
                      {combo.access_tier !== 'free' && combo.access_tier.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">Cote</div>
                      <div className="text-lg font-bold text-primary">{combo.global_odds}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">Mise</div>
                      <div className="text-sm font-semibold">{combo.stake || 0}€</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">Gain</div>
                      <div className="text-sm font-semibold text-green-500">
                        {combo.potential_win || 0}€
                      </div>
                    </div>
                  </div>

                  {combo.pronos && combo.pronos.length > 0 && (
                    <div className="text-xs text-muted-foreground pt-2 border-t">
                      {combo.pronos.length} pronostic{combo.pronos.length > 1 ? 's' : ''}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
