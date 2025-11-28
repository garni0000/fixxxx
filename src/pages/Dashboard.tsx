import { TrendingUp, Target, Award, DollarSign, Calendar, Sparkles, CreditCard, Users, User } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
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

      {/* Bottom Navigation Bar - Fixed */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 md:hidden">
        <div className="grid grid-cols-4 gap-1 px-2 py-2">
          <button
            onClick={() => navigate('/pronos/today')}
            className="flex flex-col items-center gap-1 py-2 rounded-lg hover-elevate active-elevate-2"
            data-testid="bottom-nav-pronos"
          >
            <Calendar className="h-6 w-6 text-primary" />
            <span className="text-xs font-medium">Pronos</span>
          </button>

          <button
            onClick={() => navigate('/combos')}
            className="flex flex-col items-center gap-1 py-2 rounded-lg hover-elevate active-elevate-2"
            data-testid="bottom-nav-combos"
          >
            <Sparkles className="h-6 w-6 text-yellow-500" />
            <span className="text-xs font-medium">Combos</span>
          </button>

          <button
            onClick={() => navigate('/pricing')}
            className="flex flex-col items-center gap-1 py-2 rounded-lg hover-elevate active-elevate-2"
            data-testid="bottom-nav-pricing"
          >
            <CreditCard className="h-6 w-6 text-green-500" />
            <span className="text-xs font-medium">Offres</span>
          </button>

          <button
            onClick={() => navigate('/account')}
            className="flex flex-col items-center gap-1 py-2 rounded-lg hover-elevate active-elevate-2"
            data-testid="bottom-nav-account"
          >
            <User className="h-6 w-6 text-purple-500" />
            <span className="text-xs font-medium">Compte</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default Dashboard;
