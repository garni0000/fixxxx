import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Trophy, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useToast } from '@/hooks/use-toast';
import { NotificationPermissionDialog } from '@/components/NotificationPermissionDialog';

const Register = () => {
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get('ref');
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  const { register } = useSupabaseAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (referralCode) {
      console.log('Referral code detected:', referralCode);
    }
  }, [referralCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log('Attempting registration with referral:', referralCode);
      const result = await register(formData.email, formData.password, formData.firstName, formData.lastName, referralCode || undefined);
      console.log('Registration result:', result);
      
      toast({
        title: "Inscription réussie",
        description: "Bienvenue dans la communauté VIP !",
      });
      
      // Show notification permission dialog after successful registration
      setShowNotificationDialog(true);
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: "Erreur d'inscription",
        description: error?.message || "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.id]: e.target.value
    }));
  };

  const handleNotificationDialogClose = (open: boolean) => {
    setShowNotificationDialog(open);
    if (!open) {
      navigate('/dashboard');
    }
  };

  return (
    <>
      <NotificationPermissionDialog 
        open={showNotificationDialog} 
        onOpenChange={handleNotificationDialogClose} 
      />
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 mb-6">
            <Trophy className="h-10 w-10 text-primary" />
            <span className="text-3xl font-bold vip-gradient bg-clip-text text-transparent">
              FixedPronos
            </span>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Rejoignez l'élite</h1>
          <p className="text-muted-foreground">Créez votre compte VIP en quelques secondes</p>
        </div>

        <div className="card-premium p-8">
          {referralCode && (
            <div className="mb-6 p-4 bg-primary/10 border border-primary/30 rounded-lg flex items-center gap-3">
              <UserPlus className="text-primary" size={24} />
              <div>
                <p className="font-semibold text-primary">Vous êtes parrainé !</p>
                <p className="text-sm text-muted-foreground">Code parrain: {referralCode}</p>
              </div>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom</Label>
                <Input
                  id="firstName"
                  placeholder="Jean"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom</Label>
                <Input
                  id="lastName"
                  placeholder="Dupont"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="bg-background border-border"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="votre@email.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="bg-background border-border"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full btn-vip"
              disabled={isLoading}
            >
              {isLoading ? 'Création du compte...' : "S'inscrire"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Déjà un compte ?{' '}
              <Link to="/auth/login" className="text-primary hover:underline font-semibold">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default Register;
