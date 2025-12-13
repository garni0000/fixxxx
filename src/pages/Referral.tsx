import { Navigate } from 'react-router-dom';
import { Users, DollarSign, Share2, Copy, Link as LinkIcon } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BottomNav from '@/components/BottomNav';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const Referral = () => {
  const { isAuthenticated, user, isLoading } = useSupabaseAuth();
  const { toast } = useToast();

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

  const referralCode = user?.referral?.code || '';
  const baseUrl = window.location.origin;
  const affiliateLink = `${baseUrl}/auth/register?ref=${referralCode}`;

  const copyAffiliateLink = () => {
    navigator.clipboard.writeText(affiliateLink);
    toast({
      title: "Lien copié !",
      description: "Votre lien d'affiliation a été copié dans le presse-papier.",
    });
  };

  const shareAffiliateLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'FixedPronos - Rejoignez-moi !',
          text: 'Inscrivez-vous sur FixedPronos avec mon lien et accédez aux meilleurs pronostics sportifs !',
          url: affiliateLink,
        });
      } catch (err) {
        copyAffiliateLink();
      }
    } else {
      copyAffiliateLink();
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Programme de Parrainage</h1>
          <p className="text-muted-foreground mb-8">
            Gagnez 30% de commission sur chaque filleul que vous parrainez !
          </p>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="card-premium p-6">
              <Users className="text-primary mb-4" size={32} />
              <p className="text-sm text-muted-foreground mb-1">Filleuls actifs</p>
              <p className="text-3xl font-bold">{user?.referral?.referredUsers || 0}</p>
            </div>

            <div className="card-premium p-6">
              <DollarSign className="text-primary mb-4" size={32} />
              <p className="text-sm text-muted-foreground mb-1">Gains totaux</p>
              <p className="text-3xl font-bold text-success">
                {user?.referral?.totalEarned?.toFixed(2) || '0.00'}€
              </p>
            </div>

            <div className="card-premium p-6">
              <Share2 className="text-primary mb-4" size={32} />
              <p className="text-sm text-muted-foreground mb-1">Commission</p>
              <p className="text-3xl font-bold text-primary">{user?.referral?.commission || 30}%</p>
            </div>
          </div>

          {/* Affiliate Link */}
          <div className="card-premium p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <LinkIcon className="text-primary" size={28} />
              Votre lien d'affiliation
            </h2>
            <p className="text-muted-foreground mb-6">
              Partagez ce lien avec vos amis. Quand ils s'inscrivent via votre lien, vous gagnez des commissions automatiquement !
            </p>
            
            <div className="space-y-4">
              <div className="bg-background border-2 border-primary rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-2">Lien d'affiliation</p>
                <p className="text-sm md:text-base font-mono text-primary break-all" data-testid="text-affiliate-link">
                  {affiliateLink}
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={copyAffiliateLink} size="lg" className="btn-vip flex-1" data-testid="button-copy-link">
                  <Copy className="mr-2" size={20} />
                  Copier le lien
                </Button>
                <Button onClick={shareAffiliateLink} size="lg" variant="outline" className="flex-1" data-testid="button-share-link">
                  <Share2 className="mr-2" size={20} />
                  Partager
                </Button>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-4 mt-4">
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">Code parrain: </span>
                  <span className="font-mono text-primary">{referralCode}</span>
                </p>
              </div>
            </div>
          </div>

          {/* How it works */}
          <div className="card-premium p-8">
            <h2 className="text-2xl font-bold mb-6">Comment ça marche ?</h2>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary">
                  1
                </div>
                <div>
                  <h3 className="font-bold mb-2">Partagez votre lien</h3>
                  <p className="text-muted-foreground">
                    Envoyez votre lien d'affiliation à vos amis via WhatsApp, Facebook, ou tout autre moyen.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary">
                  2
                </div>
                <div>
                  <h3 className="font-bold mb-2">Ils cliquent et s'inscrivent</h3>
                  <p className="text-muted-foreground">
                    Vos filleuls cliquent sur votre lien et sont automatiquement liés à votre compte lors de leur inscription.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary">
                  3
                </div>
                <div>
                  <h3 className="font-bold mb-2">Vous gagnez 30%</h3>
                  <p className="text-muted-foreground">
                    Recevez 30% de commission sur chaque abonnement de vos filleuls, chaque mois !
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
};

export default Referral;
