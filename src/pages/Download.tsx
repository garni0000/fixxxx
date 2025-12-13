import { useState } from 'react';
import { Download, Smartphone, CheckCircle, Share, Plus, Zap, Bell, Wifi, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Link } from 'react-router-dom';

const DownloadPage = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [isInstalling, setIsInstalling] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  const handleInstall = async () => {
    const result = await install();
    if (result.success) {
      setIsInstalling(true);
      
      try {
        await fetch('/api/push/track-install', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ timestamp: new Date().toISOString() })
        });
      } catch (e) {
        console.log('Install tracking failed');
      }
      
      setTimeout(() => {
        setIsInstalling(false);
        setJustInstalled(true);
      }, 5000);
    }
  };

  if (isInstalling) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center px-6">
          <div className="relative mb-8">
            <div className="w-32 h-32 mx-auto rounded-3xl bg-gradient-to-br from-primary via-yellow-500 to-amber-600 flex items-center justify-center shadow-2xl shadow-primary/30 animate-pulse">
              <Trophy className="w-16 h-16 text-black" />
            </div>
            <div className="absolute inset-0 w-32 h-32 mx-auto rounded-3xl border-4 border-primary/50 animate-ping" />
          </div>
          
          <h2 className="text-2xl font-bold mb-4">Installation en cours...</h2>
          
          <div className="w-64 h-2 bg-muted rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-yellow-500 rounded-full animate-loading-bar" />
          </div>
          
          <p className="text-muted-foreground mt-4">Préparation de votre expérience VIP</p>
        </div>
        
        <style>{`
          @keyframes loading-bar {
            0% { width: 0%; }
            100% { width: 100%; }
          }
          .animate-loading-bar {
            animation: loading-bar 5s ease-out forwards;
          }
        `}</style>
      </div>
    );
  }

  if (justInstalled || isInstalled) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-green-500/5 flex items-center justify-center">
        <div className="text-center px-6 max-w-md">
          <div className="relative mb-8">
            <div className="w-32 h-32 mx-auto rounded-3xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-2xl shadow-green-500/30">
              <CheckCircle className="w-16 h-16 text-white" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold mb-3">Installation réussie !</h1>
          <p className="text-muted-foreground mb-8">
            RafPronos est maintenant sur votre écran d'accueil. Profitez de vos pronos VIP !
          </p>
          
          <Link to="/">
            <Button className="btn-vip text-lg px-8 py-6">
              <Trophy className="w-5 h-5 mr-2" />
              Commencer à gagner
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8 max-w-lg">
        <div className="text-center mb-10">
          <div className="relative inline-block mb-6">
            <div className="w-28 h-28 bg-gradient-to-br from-primary via-yellow-500 to-amber-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/30 transform hover:scale-105 transition-transform">
              <Trophy className="w-14 h-14 text-black" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-4 border-background">
              <Download className="w-4 h-4 text-white" />
            </div>
          </div>
          
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-yellow-500 bg-clip-text text-transparent">
            RafPronos
          </h1>
          <p className="text-lg text-muted-foreground">L'app des gagnants</p>
        </div>

        {isIOS ? (
          <div className="bg-gradient-to-br from-card to-card/50 border border-border rounded-2xl p-6 mb-8 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Installation iOS</h2>
                <p className="text-sm text-muted-foreground">3 étapes simples</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-background/50 rounded-xl border border-border/50">
                <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center">
                  <Share className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">1. Bouton Partager</p>
                  <p className="text-sm text-muted-foreground">En bas de Safari</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-4 bg-background/50 rounded-xl border border-border/50">
                <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center">
                  <Plus className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">2. "Sur l'écran d'accueil"</p>
                  <p className="text-sm text-muted-foreground">Faites défiler le menu</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-4 bg-background/50 rounded-xl border border-border/50">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-green-500/10 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">3. Appuyez "Ajouter"</p>
                  <p className="text-sm text-muted-foreground">C'est terminé !</p>
                </div>
              </div>
            </div>
          </div>
        ) : isInstallable ? (
          <div className="mb-8">
            <Button 
              onClick={handleInstall} 
              className="w-full btn-vip text-xl py-8 rounded-2xl shadow-2xl shadow-primary/30 transform hover:scale-[1.02] transition-all"
            >
              <Download className="w-6 h-6 mr-3" />
              Installer l'application
            </Button>
            <p className="text-center text-sm text-muted-foreground mt-3">
              Gratuit • Installation rapide • Aucune donnée requise
            </p>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-card to-card/50 border border-border rounded-2xl p-6 mb-8 text-center">
            <Smartphone className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Ouvrez sur mobile</h2>
            <p className="text-muted-foreground mb-4">
              Scannez le QR code ou ouvrez ce lien sur Chrome (Android) ou Safari (iOS)
            </p>
            <Link to="/">
              <Button variant="outline" className="rounded-xl">
                Retour à l'accueil
              </Button>
            </Link>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-gradient-to-br from-card to-card/50 border border-border rounded-2xl p-5 text-center">
            <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Bell className="w-7 h-7 text-primary" />
            </div>
            <p className="font-semibold text-sm">Notifications</p>
            <p className="text-xs text-muted-foreground">En temps réel</p>
          </div>
          
          <div className="bg-gradient-to-br from-card to-card/50 border border-border rounded-2xl p-5 text-center">
            <div className="w-14 h-14 bg-gradient-to-br from-green-500/20 to-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Zap className="w-7 h-7 text-green-500" />
            </div>
            <p className="font-semibold text-sm">Accès rapide</p>
            <p className="text-xs text-muted-foreground">1 clic suffit</p>
          </div>
          
          <div className="bg-gradient-to-br from-card to-card/50 border border-border rounded-2xl p-5 text-center">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500/20 to-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Smartphone className="w-7 h-7 text-blue-500" />
            </div>
            <p className="font-semibold text-sm">Plein écran</p>
            <p className="text-xs text-muted-foreground">Mode immersif</p>
          </div>
          
          <div className="bg-gradient-to-br from-card to-card/50 border border-border rounded-2xl p-5 text-center">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500/20 to-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Wifi className="w-7 h-7 text-purple-500" />
            </div>
            <p className="font-semibold text-sm">Hors ligne</p>
            <p className="text-xs text-muted-foreground">Toujours dispo</p>
          </div>
        </div>

        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-green-500 font-medium">+500 utilisateurs actifs</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DownloadPage;
