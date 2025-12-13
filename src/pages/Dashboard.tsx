import { TrendingUp, Target, Award, DollarSign, Crown, Sparkles } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BottomNav from '@/components/BottomNav';
import PronoCard from '@/components/PronoCard';
import { usePronos } from '@/hooks/usePronos';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { Navigate, useNavigate } from 'react-router-dom';
import { getUserTier, canAccessProno } from '@/lib/tier-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const Dashboard = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, isLoading: authLoading } = useSupabaseAuth();
  const today = new Date().toISOString().split('T')[0];
  const { data: pronos, isLoading } = usePronos(today);
  
  // Obtenir le tier de l'utilisateur
  const userTier = getUserTier(user?.subscription);

  // Ne pas rediriger pendant le chargement de l'authentification
  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    </div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" />;
  }

  const stats = user?.stats || {
    totalBets: 247,
    wonBets: 198,
    lostBets: 49,
    winRate: 80.16,
    totalProfit: 3420.50
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6 sm:py-8 pb-24">
        {/* Bouton Admin - visible uniquement pour les admins */}
        {user?.isAdmin && (
          <button
            onClick={() => navigate('/admin')}
            className="w-full mb-6 flex items-center justify-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 hover-elevate active-elevate-2"
            data-testid="quick-access-admin"
          >
            <Award className="h-5 w-5 text-red-500" />
            <span className="text-sm font-semibold text-red-500">Panneau Admin</span>
          </button>
        )}

        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
            Bienvenue, <span className="vip-gradient bg-clip-text text-transparent">{user?.firstName || 'Champion'}</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">Voici votre tableau de bord VIP</p>
        </div>

        {/* Banner VIP pour non-abonnés */}
        {userTier === 'free' && (
          <div 
            onClick={() => navigate('/pricing')}
            className="mb-6 sm:mb-8 cursor-pointer group"
          >
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 p-[2px]">
              <div className="relative bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 backdrop-blur-sm rounded-2xl p-4 sm:p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-amber-400 blur-lg opacity-50 animate-pulse"></div>
                      <div className="relative bg-gradient-to-br from-amber-400 to-orange-500 p-2.5 sm:p-3 rounded-xl">
                        <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold text-base sm:text-lg text-white flex items-center gap-2">
                        Devenir VIP
                        <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                      </h3>
                      <p className="text-xs sm:text-sm text-white/80">
                        Accès illimité aux pronos premium
                      </p>
                    </div>
                  </div>
                  <Button 
                    className="bg-white hover:bg-white/90 text-orange-600 font-bold px-4 sm:px-6 py-2 rounded-xl shadow-lg group-hover:scale-105 transition-transform"
                  >
                    <span className="hidden sm:inline">Découvrir</span>
                    <span className="sm:hidden">Go</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
          <div className="card-premium p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <Target className="text-primary" size={24} />
              <span className="text-xs sm:text-sm text-muted-foreground">Paris totaux</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold">{stats.totalBets}</div>
          </div>

          <div className="card-premium p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <Award className="text-success" size={24} />
              <span className="text-xs sm:text-sm text-muted-foreground">Paris gagnés</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-success">{stats.wonBets}</div>
          </div>

          <div className="card-premium p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <TrendingUp className="text-primary" size={24} />
              <span className="text-xs sm:text-sm text-muted-foreground">Taux de réussite</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold vip-gradient bg-clip-text text-transparent">
              {stats.winRate.toFixed(1)}%
            </div>
          </div>

          <div className="card-premium p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <DollarSign className="text-primary" size={24} />
              <span className="text-xs sm:text-sm text-muted-foreground">Profit total</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-success">
              +{stats.totalProfit.toFixed(2)}€
            </div>
          </div>
        </div>

        {/* Today's Pronos */}
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Pronos du jour</h2>
          
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="card-premium p-6 animate-pulse">
                  <div className="h-8 bg-muted rounded mb-4" />
                  <div className="h-4 bg-muted rounded mb-2" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pronos?.map((prono: any) => {
                // Utiliser access_tier pour le contrôle d'accès (pas prono_type)
                const isLocked = !canAccessProno(userTier, prono.access_tier || 'free');
                
                return (
                  <PronoCard 
                    key={prono.id}
                    prono={prono}
                    isLocked={isLocked}
                  />
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />

      <BottomNav />
    </div>
  );
};

export default Dashboard;
