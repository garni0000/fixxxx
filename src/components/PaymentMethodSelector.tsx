import { useState, useEffect } from 'react';
import { Smartphone, Bitcoin, X, Upload, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { supabaseAdminService } from '@/lib/supabase-services';
import { supabase } from '@/integrations/supabase/client';

interface Plan {
  id: string;
  name: string;
  price: string;
  period: string;
}

interface PaymentMethodSelectorProps {
  selectedPlan: Plan;
  onPaymentComplete: (method: string) => void;
  onClose: () => void;
}

export default function PaymentMethodSelector({
  selectedPlan,
  onPaymentComplete,
  onClose,
}: PaymentMethodSelectorProps) {
  const [paymentMethod, setPaymentMethod] = useState('moneyfusion_auto');
  const [isProcessing, setIsProcessing] = useState(false);
  const [cryptoAddress, setCryptoAddress] = useState('');
  const [cryptoTxHash, setCryptoTxHash] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [mobileProvider, setMobileProvider] = useState('Orange Money');
  const [notes, setNotes] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const { toast } = useToast();
  const { user } = useSupabaseAuth();

  const [enabledMethods, setEnabledMethods] = useState({
    moneyfusion: true,
    crypto: true,
    mobile_money: true
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data } = await supabase
          .from('app_settings')
          .select('*')
          .eq('id', 'main')
          .single();
        if (data) {
          setEnabledMethods({
            moneyfusion: data.payment_moneyfusion_enabled,
            crypto: data.payment_crypto_enabled,
            mobile_money: data.payment_mobile_money_enabled
          });
          if (!data.payment_moneyfusion_enabled && paymentMethod === 'moneyfusion_auto') {
            if (data.payment_crypto_enabled) setPaymentMethod('crypto');
            else if (data.payment_mobile_money_enabled) setPaymentMethod('mobile_money');
          }
        }
      } catch (error) {
        console.error('Error loading payment settings:', error);
      }
    };
    loadSettings();
  }, []);

  const handlePayment = async () => {
    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour soumettre un paiement",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Paiement automatique MoneyFusion
      if (paymentMethod === 'moneyfusion_auto') {
        if (!mobileNumber.trim() || !customerName.trim()) {
          toast({
            title: "Erreur",
            description: "Veuillez remplir tous les champs requis",
            variant: "destructive",
          });
          setIsProcessing(false);
          return;
        }

        // Appeler la fonction serverless pour initier le paiement MoneyFusion
        try {
          const response = await fetch('/api/payment/initiate-moneyfusion', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: user.id,
              amount: parseFloat(selectedPlan.price),
              plan: selectedPlan.id,
              phoneNumber: mobileNumber,
              customerName: customerName,
            }),
          });

          // Vérifier que la réponse contient du JSON
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            // Serverless function pas disponible (développement local)
            throw new Error('SERVERLESS_NOT_AVAILABLE');
          }

          const data = await response.json();

          if (data.success && data.paymentUrl) {
            // Enregistrer le paiement en attente dans Supabase
            await supabaseAdminService.submitPayment({
              userId: user.id,
              amount: parseFloat(selectedPlan.price),
              plan: selectedPlan.id as 'basic' | 'pro' | 'vip',
              method: 'mobile_money',
              mobileNumber: mobileNumber,
              notes: `MoneyFusion Token: ${data.paymentToken}\nClient: ${customerName}\nPaiement en cours`,
            });

            // Rediriger vers la page de paiement MoneyFusion
            window.location.href = data.paymentUrl;
          } else {
            // Afficher les détails de l'erreur de MoneyFusion
            const errorMessage = data.details || data.error || 'Échec de l\'initiation du paiement';
            console.error('MoneyFusion error details:', data);
            throw new Error(errorMessage);
          }
        } catch (error: any) {
          if (error.message === 'SERVERLESS_NOT_AVAILABLE') {
            // Mode développement - Enregistrer pour approbation manuelle
            await supabaseAdminService.submitPayment({
              userId: user.id,
              amount: parseFloat(selectedPlan.price),
              plan: selectedPlan.id as 'basic' | 'pro' | 'vip',
              method: 'mobile_money',
              mobileNumber: mobileNumber,
              notes: `Client: ${customerName}\nNuméro: ${mobileNumber}\n⚠️ MODE DEV - Les paiements automatiques MoneyFusion ne fonctionnent qu'en production sur Vercel`,
            });

            toast({
              title: "⚠️ Mode Développement",
              description: "Les paiements MoneyFusion automatiques ne fonctionnent qu'en production sur Vercel. Votre demande a été enregistrée pour approbation manuelle.",
              duration: 8000,
            });

            setTimeout(() => {
              window.location.href = '/payment/callback';
            }, 2000);
          } else {
            throw error;
          }
        }
        
        return;
      }

      // Validation pour paiements manuels
      if (paymentMethod === 'crypto' && !cryptoAddress.trim()) {
        toast({
          title: "Erreur",
          description: "Veuillez saisir l'adresse crypto",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      if (paymentMethod === 'mobile_money' && !mobileNumber.trim()) {
        toast({
          title: "Erreur",
          description: "Veuillez saisir le numéro de téléphone",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      if (!proofFile) {
        toast({
          title: "Erreur",
          description: "Veuillez télécharger une preuve de paiement",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      // Submit payment to Supabase avec le plan sélectionné
      await supabaseAdminService.submitPayment({
        userId: user.id,
        amount: parseFloat(selectedPlan.price),
        plan: selectedPlan.id as 'basic' | 'pro' | 'vip', // Plan d'abonnement choisi
        method: paymentMethod as 'crypto' | 'mobile_money',
        cryptoAddress: paymentMethod === 'crypto' ? cryptoAddress : undefined,
        cryptoTxHash: paymentMethod === 'crypto' ? cryptoTxHash : undefined,
        mobileNumber: paymentMethod === 'mobile_money' ? mobileNumber : undefined,
        mobileProvider: paymentMethod === 'mobile_money' ? mobileProvider : undefined,
        notes,
        proofFile,
      });

      toast({
        title: "Paiement soumis",
        description: "Votre demande de paiement a été soumise et sera traitée sous 24h",
      });
      
      onPaymentComplete(paymentMethod);
    } catch (error) {
      console.error('Payment submission error:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de la soumission du paiement",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
          <CardTitle>Finaliser votre abonnement</CardTitle>
          <CardDescription>
            Plan sélectionné: <span className="text-foreground font-semibold">{selectedPlan.name}</span> - {selectedPlan.price}€/{selectedPlan.period}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Payment Method Selection */}
          <div>
            <Label className="text-base mb-4 block">Méthode de paiement</Label>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              <div className="space-y-3">
                {/* Mobile Money Automatique - MoneyFusion */}
                {enabledMethods.moneyfusion && (
                  <label className="flex items-center gap-4 p-4 border-2 border-primary rounded-lg cursor-pointer hover:bg-accent transition-colors">
                    <RadioGroupItem value="moneyfusion_auto" id="moneyfusion_auto" />
                    <Zap className="w-6 h-6 text-primary" />
                    <div className="flex-1">
                      <div className="font-medium flex items-center gap-2">
                        Mobile Money Automatique
                        <Badge variant="default" className="text-xs">Recommandé</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">Paiement instantané - Orange, MTN, Moov</div>
                    </div>
                  </label>
                )}

                {/* Crypto */}
                {enabledMethods.crypto && (
                  <label className="flex items-center gap-4 p-4 border rounded-lg cursor-pointer hover:bg-accent transition-colors">
                    <RadioGroupItem value="crypto" id="crypto" />
                    <Bitcoin className="w-6 h-6 text-primary" />
                    <div className="flex-1">
                      <div className="font-medium">Cryptomonnaies</div>
                      <div className="text-sm text-muted-foreground">Bitcoin, USDT, Ethereum (Manuel)</div>
                    </div>
                  </label>
                )}

                {/* Mobile Money Manuel */}
                {enabledMethods.mobile_money && (
                  <label className="flex items-center gap-4 p-4 border rounded-lg cursor-pointer hover:bg-accent transition-colors">
                    <RadioGroupItem value="mobile_money" id="mobile_money" />
                    <Smartphone className="w-6 h-6 text-primary" />
                    <div className="flex-1">
                      <div className="font-medium">Mobile Money Manuel</div>
                      <div className="text-sm text-muted-foreground">Orange, MTN, Moov (Envoi manuel + preuve)</div>
                    </div>
                  </label>
                )}
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Payment Details Form */}
          {paymentMethod === 'moneyfusion_auto' && (
            <div className="space-y-4">
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-primary" />
                  <p className="font-semibold text-primary">Paiement Automatique</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Vous serez redirigé vers une page de paiement sécurisée. Votre abonnement sera activé automatiquement après confirmation du paiement.
                </p>
              </div>

              <div>
                <Label htmlFor="customer-name">Votre nom complet *</Label>
                <Input
                  id="customer-name"
                  placeholder="Ex: Jean Kouassi"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  data-testid="input-customer-name"
                />
              </div>

              <div>
                <Label htmlFor="phone-auto">Numéro de téléphone Mobile Money *</Label>
                <Input
                  id="phone-auto"
                  placeholder="+225 XX XX XX XX XX"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  data-testid="input-phone-auto"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Le numéro qui effectuera le paiement (Orange, MTN, Moov)
                </p>
              </div>

              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Montant à payer</span>
                  <span className="font-bold text-lg text-primary">{selectedPlan.price}€</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Frais de transaction inclus • Activation instantanée
                </p>
              </div>
            </div>
          )}

          {paymentMethod === 'crypto' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="crypto-type">Cryptomonnaie</Label>
                <select
                  id="crypto-type"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option>Bitcoin (BTC)</option>
                  <option>USDT (TRC20)</option>
                  <option>Ethereum (ETH)</option>
                </select>
              </div>
              <div>
                <Label htmlFor="crypto-address">Adresse de destination</Label>
                <Input
                  id="crypto-address"
                  placeholder="bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"
                  value={cryptoAddress}
                  onChange={(e) => setCryptoAddress(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="tx-hash">Hash de transaction (optionnel)</Label>
                <Input
                  id="tx-hash"
                  placeholder="Transaction hash après paiement"
                  value={cryptoTxHash}
                  onChange={(e) => setCryptoTxHash(e.target.value)}
                />
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">
                  <strong>Adresse de réception:</strong>
                </p>
                <p className="text-xs font-mono bg-background p-2 rounded border">
                  bc1qexampleaddressforfixedpronosvip123456789
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Envoyez exactement {selectedPlan.price}€ en crypto à cette adresse
                </p>
              </div>
            </div>
          )}

          {paymentMethod === 'mobile_money' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="phone">Numéro de téléphone</Label>
                <Input
                  id="phone"
                  placeholder="+225 XX XX XX XX XX"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="operator">Opérateur</Label>
                <select
                  id="operator"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={mobileProvider}
                  onChange={(e) => setMobileProvider((document.getElementById('operator') as HTMLSelectElement).value)}
                >
                  <option>Orange Money</option>
                  <option>MTN Mobile Money</option>
                  <option>Moov Money</option>
                </select>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">
                  <strong>Numéro de réception:</strong>
                </p>
                <p className="text-xs font-mono bg-background p-2 rounded border">
                  +225 01 02 03 04 05
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Envoyez {selectedPlan.price}€ via {mobileProvider} à ce numéro
                </p>
              </div>
            </div>
          )}

          {/* Proof Upload - Only for manual payments */}
          {paymentMethod !== 'moneyfusion_auto' && (
            <div>
              <Label htmlFor="proof" className="text-base mb-2 block">Preuve de paiement *</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  Téléchargez une capture d'écran de votre paiement
                </p>
                <Input
                  id="proof"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                  className="max-w-xs mx-auto"
                />
                {proofFile && (
                  <p className="text-xs text-green-600 mt-2">
                    Fichier sélectionné: {proofFile.name}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              placeholder="Ajoutez des informations supplémentaires..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Summary */}
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Plan {selectedPlan.name}</span>
              <span className="font-medium">{selectedPlan.price}€</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span className="text-primary">{selectedPlan.price}€</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Annuler
            </Button>
            <Button
              onClick={handlePayment}
              disabled={isProcessing}
              className="flex-1"
              data-testid="button-confirm-payment"
            >
              {isProcessing ? 'Traitement...' : (
                paymentMethod === 'moneyfusion_auto' ? 'Procéder au paiement →' : 'Confirmer le paiement'
              )}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            En confirmant, vous acceptez nos conditions générales d'utilisation et notre politique de confidentialité.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
