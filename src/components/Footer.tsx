import { Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Trophy className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold vip-gradient bg-clip-text text-transparent">
                FixedPronos
              </span>
            </div>
            <p className="text-muted-foreground text-sm">
              Les meilleurs pronostics VIP pour maximiser vos gains.
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-4 text-foreground">Navigation</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="text-muted-foreground hover:text-primary transition-colors">Accueil</Link></li>
              <li><Link to="/pronos/today" className="text-muted-foreground hover:text-primary transition-colors">Pronos du jour</Link></li>
              <li><Link to="/dashboard" className="text-muted-foreground hover:text-primary transition-colors">Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-4 text-foreground">Compte</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/auth/login" className="text-muted-foreground hover:text-primary transition-colors">Connexion</Link></li>
              <li><Link to="/auth/register" className="text-muted-foreground hover:text-primary transition-colors">Inscription</Link></li>
              <li><Link to="/account" className="text-muted-foreground hover:text-primary transition-colors">Mon compte</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-4 text-foreground">Support</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Contact</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">FAQ</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">CGU</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            © 2025 FixedPronos. Tous droits réservés.
          </p>
          <p className="text-xs text-muted-foreground">
            ⚠️ Les paris comportent des risques. Jouez de manière responsable. +18 ans.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
