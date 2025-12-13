import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Trophy, Target, TrendingUp, Shield, Star, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PronoCard from '@/components/PronoCard';
import { usePronos } from '@/hooks/usePronos';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { getUserTier, getPronoTier, canAccessProno } from '@/lib/tier-utils';

const Index = () => {
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];
  const { data: pronos, isLoading } = usePronos(today);
  const { user, isLoading: authLoading } = useSupabaseAuth();
  
  // Obtenir le tier de l'utilisateur
  const userTier = getUserTier(user?.subscription);

  // Rediriger vers le dashboard si l'utilisateur est connecté
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard');
    }
  }, [user, authLoading, navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent opacity-30" />
        <div className="container mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-6">
              <Trophy className="text-primary" size={20} />
              <span className="text-primary font-semibold">Plateforme VIP Premium</span>
            </div>
            
            <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Accès <span className="vip-gradient bg-clip-text text-transparent">VIP</span> aux meilleurs pronostics du marché
            </h1>
            
            <p className="text-base sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto px-4">
              Rejoignez l'élite des parieurs avec nos analyses professionnelles et nos pronostics à fort taux de réussite.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth/register">
                <Button size="lg" className="btn-vip text-lg px-8 py-6">
                  Commencer maintenant
                </Button>
              </Link>
              <Link to="/pronos/today">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                  Voir les pronos
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-20 px-4 bg-card/50">
        <div className="container mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 sm:mb-12">
            Pourquoi choisir <span className="vip-gradient bg-clip-text text-transparent">FixedPronos</span> ?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card-premium p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                <Target className="text-primary" size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-3">Analyses Professionnelles</h3>
              <p className="text-muted-foreground">
                Nos experts analysent chaque match en profondeur pour vous offrir les meilleurs pronostics.
              </p>
            </div>

            <div className="card-premium p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                <TrendingUp className="text-primary" size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-3">Taux de Réussite Élevé</h3>
              <p className="text-muted-foreground">
                Plus de 80% de pronostics gagnants sur les derniers mois. Performance constante.
              </p>
            </div>

            <div className="card-premium p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                <Shield className="text-primary" size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-3">Garantie Satisfaction</h3>
              <p className="text-muted-foreground">
                Service VIP avec support dédié et remboursement si non satisfait.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Today's Pronos */}
      <section className="py-12 sm:py-20 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 sm:mb-12">
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">Pronos du jour</h2>
              <p className="text-sm sm:text-base text-muted-foreground">Découvrez nos analyses du {new Date().toLocaleDateString('fr-FR')}</p>
            </div>
            <Link to="/pronos/today">
              <Button variant="outline" className="w-full sm:w-auto">Voir tout</Button>
            </Link>
          </div>

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
              {pronos?.slice(0, 3).map((prono: any) => {
                // Utiliser access_tier directement (pas prono_type)
                const pronoTier = (prono.access_tier || 'free') as 'free' | 'basic' | 'pro' | 'vip';
                const isLocked = !canAccessProno(userTier, pronoTier);
                
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
      </section>

      {/* Stats Section */}
      <section className="py-12 sm:py-20 px-4 bg-card/50">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl sm:text-5xl font-bold vip-gradient bg-clip-text text-transparent mb-2">80%</div>
              <p className="text-sm sm:text-base text-muted-foreground">Taux de réussite</p>
            </div>
            <div>
              <div className="text-4xl sm:text-5xl font-bold vip-gradient bg-clip-text text-transparent mb-2">10K+</div>
              <p className="text-sm sm:text-base text-muted-foreground">Membres VIP actifs</p>
            </div>
            <div>
              <div className="text-4xl sm:text-5xl font-bold vip-gradient bg-clip-text text-transparent mb-2">500+</div>
              <p className="text-sm sm:text-base text-muted-foreground">Pronos par mois</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-20 px-4">
        <div className="container mx-auto">
          <div className="card-premium p-6 sm:p-12 text-center max-w-3xl mx-auto">
            <Star className="text-primary mx-auto mb-4 sm:mb-6" size={48} />
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">Prêt à rejoindre l'élite ?</h2>
            <p className="text-base sm:text-xl text-muted-foreground mb-6 sm:mb-8 px-4">
              Accédez aux pronostics VIP et commencez à gagner dès aujourd'hui.
            </p>
            <Link to="/auth/register">
              <Button size="lg" className="btn-vip text-base sm:text-lg px-8 sm:px-12 py-6 w-full sm:w-auto">
                S'inscrire maintenant
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
