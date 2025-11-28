import { Link } from 'react-router-dom';
import { Calendar, Lock } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PronoCard from '@/components/PronoCard';
import { usePronos } from '@/hooks/usePronos';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { getUserTier, canAccessProno } from '@/lib/tier-utils';
import { useIsAdmin } from '@/hooks/useIsAdmin';

const PronosBeforeYesterday = () => {
  const beforeYesterday = new Date(Date.now() - 172800000);
  const beforeYesterdayDate = beforeYesterday.toISOString().split('T')[0];
  const { data: pronos, isLoading } = usePronos(beforeYesterdayDate);
  const { user } = useSupabaseAuth();
  const { isAdmin } = useIsAdmin();

  // Obtenir le tier de l'utilisateur
  const userTier = getUserTier(user?.subscription);

  // Compter les pronos verrouillés par tier
  const lockedCounts = {
    basic: 0,
    pro: 0,
    vip: 0
  };

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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Pronos d'avant-hier</h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <Calendar size={16} />
              {beforeYesterday.toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>

          <div className="flex gap-2">
            <Link to="/pronos/today">
              <Button variant="outline">Aujourd'hui</Button>
            </Link>
            <Link to="/pronos/yesterday">
              <Button variant="outline">Hier</Button>
            </Link>
          </div>
        </div>

        {/* Message pour pronos verrouillés */}
        {totalLockedCount > 0 && (
          <Card className="mb-6 p-6 bg-primary/5 border-primary/20">
            <div className="flex items-center gap-4">
              <Lock className="h-8 w-8 text-primary" />
              <div>
                <h3 className="text-lg font-semibold">
                  {totalLockedCount} prono{totalLockedCount > 1 ? 's' : ''} verrouillé{totalLockedCount > 1 ? 's' : ''}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {lockedCounts.basic > 0 && `${lockedCounts.basic} BASIC`}
                  {lockedCounts.pro > 0 && (lockedCounts.basic > 0 ? ', ' : '') + `${lockedCounts.pro} PRO`}
                  {lockedCounts.vip > 0 && ((lockedCounts.basic > 0 || lockedCounts.pro > 0) ? ', ' : '') + `${lockedCounts.vip} VIP`}
                  {' - '}Abonnez-vous pour débloquer tous les pronos premium
                </p>
              </div>
              <Link to="/pricing" className="ml-auto">
                <Button variant="default">Voir les offres</Button>
              </Link>
            </div>
          </Card>
        )}

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2].map(i => (
              <div key={i} className="card-premium p-6 animate-pulse">
                <div className="h-8 bg-muted rounded mb-4" />
                <div className="h-4 bg-muted rounded mb-2" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : pronos && pronos.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          <div className="text-center py-20">
            <p className="text-2xl text-muted-foreground">Aucun prono disponible pour ce jour</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default PronosBeforeYesterday;
