import { useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PaymentMethodSelector from '@/components/PaymentMethodSelector';
import { useToast } from '@/hooks/use-toast';

const plans = [
  {
    id: 'basic',
    name: 'Basic',
    price: '3000',
    period: 'mois',
    description: 'Pour débuter avec nos pronostics',
    features: [
      'Accès aux pronos quotidiens',
      'Pronos Safe uniquement',
      '3-5 pronos par jour',
      'Support email 48h',
      'Historique 7 jours',
    ],
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '8900',
    period: 'mois',
    description: 'Le meilleur rapport qualité-prix',
    features: [
      'Tous les avantages Basic',
      'Pronos Safe + Risk',
      '10-15 pronos par jour',
      'Support prioritaire 24h',
      'Historique 30 jours',
      'Analyses détaillées',
      'Notifications temps réel',
    ],
    popular: true,
  },
  {
    id: 'vip',
    name: 'VIP',
    price: '19000',
    period: 'mois',
    description: 'Accès illimité premium',
    features: [
      'Tous les avantages Pro',
      'Pronos Safe + Risk + VIP Exclusive',
      'Pronos illimités',
      'Support VIP 24/7',
      'Historique illimité',
      'Analyses expertes personnalisées',
      'Notifications instantanées',
      'Accès groupe VIP Telegram',
      'Conseils personnalisés',
      '30% commission parrainage',
    ],
    popular: false,
  },
];

export default function Pricing() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const { toast } = useToast();

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
    setShowPayment(true);
  };

  const handlePaymentComplete = (method: string) => {
    toast({
      title: "Abonnement en cours",
      description: `Traitement du paiement via ${method}...`,
    });
    // Backend integration will handle actual payment
  };

  return (
    <div className="min-h-screen bg-background py-8 sm:py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Choisissez votre plan
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto px-4">
            Investissez dans votre succès avec nos pronostics premium
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-12">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative ${
                plan.popular
                  ? 'border-primary shadow-lg shadow-primary/20 md:scale-105'
                  : 'border-border'
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                  Plus populaire
                </Badge>
              )}
              
              <CardHeader>
                <CardTitle className="text-xl sm:text-2xl">{plan.name}</CardTitle>
                <CardDescription className="text-sm">{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-3xl sm:text-4xl font-bold text-foreground">
                    {plan.price} FCFA
                  </span>
                  <span className="text-sm sm:text-base text-muted-foreground">/{plan.period}</span>
                </div>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  onClick={() => handleSelectPlan(plan.id)}
                  variant={plan.popular ? 'default' : 'outline'}
                  className="w-full"
                >
                  Choisir {plan.name}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Payment Method Selector */}
        {showPayment && selectedPlan && (
          <PaymentMethodSelector
            selectedPlan={plans.find(p => p.id === selectedPlan)!}
            onPaymentComplete={handlePaymentComplete}
            onClose={() => {
              setShowPayment(false);
              setSelectedPlan(null);
            }}
          />
        )}

        {/* Trust Badges */}
        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground mb-6">
            Paiements sécurisés et garantie satisfait ou remboursé 14 jours
          </p>
          <div className="flex justify-center items-center gap-8 flex-wrap">
            <div className="text-muted-foreground text-sm">🔒 SSL Sécurisé</div>
            <div className="text-muted-foreground text-sm">📱 Mobile Money</div>
            <div className="text-muted-foreground text-sm">₿ Crypto</div>
            <div className="text-muted-foreground text-sm">✨ Validation manuelle</div>
          </div>
        </div>
      </div>
    </div>
  );
}
