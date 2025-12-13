import { Navigate } from 'react-router-dom';
import { User, CreditCard, Shield, Calendar } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BottomNav from '@/components/BottomNav';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const Account = () => {
  const { isAuthenticated, user, isLoading } = useSupabaseAuth();

  if (isLoading) {
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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Mon Compte</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card-premium p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <User className="text-primary" />
                Informations personnelles
              </h2>
              
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Prénom</label>
                    <p className="text-lg font-semibold">{user?.firstName}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Nom</label>
                    <p className="text-lg font-semibold">{user?.lastName}</p>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm text-muted-foreground">Email</label>
                  <p className="text-lg font-semibold">{user?.email}</p>
                </div>
              </div>
            </div>

            {/* Subscription */}
            <div className="card-premium p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Shield className="text-primary" />
                Abonnement
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Statut</span>
                  <Badge className={user?.subscription.status === 'active' ? 'bg-success' : 'bg-destructive'}>
                    {user?.subscription.status === 'active' ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Plan</span>
                  <span className="font-bold text-primary uppercase">{user?.subscription.plan}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Date de début</span>
                  <span className="font-semibold">
                    {user?.subscription.startDate && new Date(user.subscription.startDate).toLocaleDateString('fr-FR')}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Date de fin</span>
                  <span className="font-semibold">
                    {user?.subscription.endDate && new Date(user.subscription.endDate).toLocaleDateString('fr-FR')}
                  </span>
                </div>

                <Button className="w-full btn-vip mt-4">
                  Renouveler l'abonnement
                </Button>
              </div>
            </div>

            {/* Payment History */}
            <div className="card-premium p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <CreditCard className="text-primary" />
                Historique des paiements
              </h2>

              <div className="space-y-3">
                {[
                  { date: '2025-01-01', amount: 99.99, status: 'Payé' },
                  { date: '2024-12-01', amount: 99.99, status: 'Payé' },
                  { date: '2024-11-01', amount: 99.99, status: 'Payé' },
                ].map((payment, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                    <div>
                      <p className="font-semibold">{payment.amount}€</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(payment.date).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <Badge className="bg-success">{payment.status}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Stats Sidebar */}
          <div className="space-y-6">
            <div className="card-premium p-6">
              <h3 className="text-xl font-bold mb-4">Mes statistiques</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Paris totaux</p>
                  <p className="text-2xl font-bold">{user?.stats?.totalBets || 0}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Taux de réussite</p>
                  <p className="text-2xl font-bold text-success">
                    {user?.stats?.winRate?.toFixed(1) || 0}%
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Profit total</p>
                  <p className="text-2xl font-bold text-primary">
                    +{user?.stats?.totalProfit?.toFixed(2) || 0}€
                  </p>
                </div>
              </div>
            </div>

            <div className="card-premium p-6">
              <h3 className="text-xl font-bold mb-4">Parrainage</h3>
              <p className="text-muted-foreground mb-4 text-sm">
                Gagnez 30% de commission sur chaque filleul !
              </p>
              <Button variant="outline" className="w-full">
                Voir mon code
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
};

export default Account;
