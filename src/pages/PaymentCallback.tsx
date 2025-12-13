import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function PaymentCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Vérification du paiement en cours...');

  useEffect(() => {
    // MoneyFusion redirige l'utilisateur ici après le paiement
    // Le webhook sera appelé automatiquement pour activer l'abonnement
    
    setStatus('success');
    setMessage('Votre paiement est en cours de traitement. Votre abonnement sera activé automatiquement dès confirmation du paiement (généralement sous quelques minutes).');
  }, [location]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-12 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            {status === 'loading' && (
              <>
                <Loader2 className="w-16 h-16 mx-auto mb-4 text-primary animate-spin" />
                <CardTitle>Vérification...</CardTitle>
                <CardDescription>Veuillez patienter</CardDescription>
              </>
            )}
            
            {status === 'success' && (
              <>
                <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
                <CardTitle className="text-green-600">Paiement Réussi!</CardTitle>
                <CardDescription>Votre transaction a été confirmée</CardDescription>
              </>
            )}
            
            {status === 'error' && (
              <>
                <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
                <CardTitle className="text-red-600">Erreur</CardTitle>
                <CardDescription>Un problème est survenu</CardDescription>
              </>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">
              {message}
            </p>

            {status === 'success' && (
              <div className="space-y-2 pt-4">
                <Button 
                  className="w-full" 
                  onClick={() => navigate('/dashboard')}
                  data-testid="button-go-dashboard"
                >
                  Accéder au Tableau de Bord
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => navigate('/account')}
                  data-testid="button-go-account"
                >
                  Voir Mon Compte
                </Button>
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-2 pt-4">
                <Button 
                  className="w-full" 
                  onClick={() => navigate('/pricing')}
                  data-testid="button-retry"
                >
                  Réessayer
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => navigate('/dashboard')}
                  data-testid="button-go-home"
                >
                  Retour à l'accueil
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
