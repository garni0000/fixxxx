import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BottomNav from '@/components/BottomNav';
import { supabaseComboService } from '@/lib/supabase-services';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { Calendar, Lock, Trophy, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function Combos() {
  const navigate = useNavigate();
  const { user } = useSupabaseAuth();
  const [combos, setCombos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

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
      
      <main className="flex-1 container mx-auto px-3 sm:px-4 py-4 sm:py-8 pb-24">
        <div className="mb-4 sm:mb-8">
          <h1 className="text-xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2">Paris Combinés</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Nos meilleurs paris combinés</p>
        </div>

        {loading ? (
          <div className="text-center py-8 sm:py-12">Chargement...</div>
        ) : combos.length === 0 ? (
          <Card>
            <CardContent className="py-8 sm:py-12 text-center text-muted-foreground text-sm sm:text-base">
              Aucun combo disponible pour le moment
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {combos.map((combo) => (
              <Card
                key={combo.id}
                className="cursor-pointer hover-elevate active-elevate-2 overflow-hidden"
                onClick={() => handleComboClick(combo)}
                data-testid={`card-combo-${combo.id}`}
              >
                <CardHeader className="p-4 pb-3">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <Badge className={`${getTierColor(combo.access_tier)} text-xs px-2 py-1`}>
                        {combo.access_tier === 'free' && 'FREE'}
                        {combo.access_tier === 'basic' && <><Lock className="h-3 w-3 mr-1" />BASIC</>}
                        {combo.access_tier === 'pro' && <><Lock className="h-3 w-3 mr-1" />PRO</>}
                        {combo.access_tier === 'vip' && <><Lock className="h-3 w-3 mr-1" />VIP</>}
                      </Badge>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(new Date(combo.match_date), 'dd MMM yyyy', { locale: fr })}
                      </span>
                    </div>
                    <Badge variant={getStatusColor(combo.status)} className="text-xs">
                      {combo.status === 'won' && <><Trophy className="h-3 w-3 mr-1" />Gagné</>}
                      {combo.status === 'lost' && 'Perdu'}
                      {combo.status === 'pending' && 'En cours'}
                    </Badge>
                  </div>
                  
                  <CardTitle className="text-lg mb-1">{combo.title}</CardTitle>
                  {combo.description && (
                    <CardDescription className="text-sm">{combo.description}</CardDescription>
                  )}
                </CardHeader>

                <CardContent className="p-4 pt-0 space-y-4">
                  {/* Thumbnail image du coupon */}
                  {combo.coupon_image_url && !failedImages.has(combo.id) && (
                    <div className="relative w-full h-40 rounded-lg overflow-hidden bg-secondary/50 border border-border/50">
                      <img 
                        src={combo.coupon_image_url} 
                        alt={combo.title}
                        className="w-full h-full object-contain"
                        loading="lazy"
                        onError={() => {
                          setFailedImages(prev => new Set(prev).add(combo.id));
                        }}
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                    <div className="flex gap-6">
                      <div>
                        <div className="text-[10px] uppercase text-muted-foreground">Cote totale</div>
                        <div className="text-xl font-bold text-primary">{combo.global_odds}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase text-muted-foreground">Mise</div>
                        <div className="text-sm font-semibold">{combo.stake || 0}€</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase text-muted-foreground">Gain potentiel</div>
                        <div className="text-sm font-semibold text-green-500">{combo.potential_win || 0}€</div>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
}
