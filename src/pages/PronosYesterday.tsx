import { Link } from 'react-router-dom';
import { Calendar, Lock } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BottomNav from '@/components/BottomNav';
import PronoCard from '@/components/PronoCard';
import { usePronos } from '@/hooks/usePronos';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { getUserTier, canAccessProno } from '@/lib/tier-utils';
import { useIsAdmin } from '@/hooks/useIsAdmin';

const PronosYesterday = () => {
  const yesterday = new Date(Date.now() - 86400000);
  const yesterdayDate = yesterday.toISOString().split('T')[0];
  const { data: pronos, isLoading } = usePronos(yesterdayDate);
  const { user } = useSupabaseAuth();
  const { isAdmin } = useIsAdmin();

  const userTier = getUserTier(user?.subscription);

  const lockedCounts = { basic: 0, pro: 0, vip: 0 };

  (pronos || []).forEach((prono: any) => {
    const pronoTier = prono.access_tier || 'free';
    if (!canAccessProno(userTier, pronoTier)) {
      if (pronoTier === 'basic') lockedCounts.basic++;
      if (pronoTier === 'pro') lockedCounts.pro++;
      if (pronoTier === 'vip') lockedCounts.vip++;
    }
  });

  const totalLockedCount = lockedCounts.basic + lockedCounts.pro + lockedCounts.vip;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-1">Pronos d'hier</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Calendar size={14} />
              {yesterday.toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                day: 'numeric',
                month: 'short'
              })}
            </p>
          </div>

          <div className="flex gap-2">
            <Link to="/pronos/today">
              <Button variant="outline" size="sm" className="text-xs">Aujourd'hui</Button>
            </Link>
            <Link to="/pronos/before-yesterday">
              <Button variant="outline" size="sm" className="text-xs">Avant-hier</Button>
            </Link>
          </div>
        </div>

        {totalLockedCount > 0 && (
          <Card className="mb-4 p-3 sm:p-4 bg-primary/5 border-primary/20">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  {totalLockedCount} prono{totalLockedCount > 1 ? 's' : ''} verrouillé{totalLockedCount > 1 ? 's' : ''}
                </p>
              </div>
              <Link to="/pricing">
                <Button variant="default" size="sm" className="text-xs">Débloquer</Button>
              </Link>
            </div>
          </Card>
        )}

        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-card/50 border border-border/50 rounded-xl p-4 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-muted rounded-lg" />
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                    <div className="h-4 bg-muted rounded w-2/3 mb-1" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : pronos && pronos.length > 0 ? (
          <div className="flex flex-col gap-3">
            {pronos.map((prono: any) => {
              const pronoTier = prono.access_tier || 'free';
              const isLocked = !canAccessProno(userTier, pronoTier);
              
              return (
                <PronoCard 
                  key={prono.id}
                  prono={prono}
                  isLocked={isLocked}
                  showAdminActions={isAdmin}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-lg text-muted-foreground">Aucun prono disponible pour hier</p>
          </div>
        )}
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
};

export default PronosYesterday;
