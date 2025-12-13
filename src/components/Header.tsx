import { Link } from 'react-router-dom';
import { Trophy, Menu, X, Home, BarChart3, CreditCard, User, Gift, LogOut, Star, Settings } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { NotificationBell } from './NotificationBell';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, logout } = useSupabaseAuth();
  const { isAdmin } = useIsAdmin();

  const closeMenu = () => setIsMenuOpen(false);

  const handleLogout = () => {
    logout();
    closeMenu();
  };

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50 backdrop-blur-sm bg-card/95">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            <span className="text-lg sm:text-2xl font-bold vip-gradient bg-clip-text text-transparent">
              FixedPronos
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="text-sm text-foreground hover:text-primary transition-colors">
                  Dashboard
                </Link>
                <Link to="/pronos/today" className="text-sm text-foreground hover:text-primary transition-colors">
                  Pronos
                </Link>
                <Link to="/combos" className="text-sm text-foreground hover:text-primary transition-colors">
                  Combos
                </Link>
                <Link to="/pricing" className="text-sm text-foreground hover:text-primary transition-colors">
                  Tarifs
                </Link>
                <Link to="/account" className="text-sm text-foreground hover:text-primary transition-colors">
                  Compte
                </Link>
                <Link to="/referral" className="text-sm text-foreground hover:text-primary transition-colors">
                  Parrainage
                </Link>
                {isAdmin && (
                  <Link to="/admin" className="text-sm text-primary font-semibold hover:text-primary/80 transition-colors">
                    Admin
                  </Link>
                )}
                <NotificationBell />
                <Button variant="outline" size="sm" onClick={logout}>
                  Déconnexion
                </Button>
              </>
            ) : (
              <>
                <Link to="/pricing" className="text-sm text-foreground hover:text-primary transition-colors">
                  Tarifs
                </Link>
                <NotificationBell />
                <Link to="/auth/login">
                  <Button variant="outline" size="sm">Connexion</Button>
                </Link>
                <Link to="/auth/register">
                  <Button className="btn-vip" size="sm">S'inscrire</Button>
                </Link>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-1 lg:hidden">
            <NotificationBell />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              data-testid="button-menu-toggle"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation - Slide Down Menu */}
        <div
          className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            isMenuOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <nav className="py-4 space-y-1 border-t border-border">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="flex items-center gap-3 px-3 py-3 rounded-md text-foreground hover-elevate active-elevate-2"
                  onClick={closeMenu}
                  data-testid="link-dashboard-mobile"
                >
                  <Home className="h-5 w-5 text-primary" />
                  <span className="font-medium">Dashboard</span>
                </Link>

                <Link
                  to="/pronos/today"
                  className="flex items-center gap-3 px-3 py-3 rounded-md text-foreground hover-elevate active-elevate-2"
                  onClick={closeMenu}
                  data-testid="link-pronos-mobile"
                >
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <span className="font-medium">Pronos du Jour</span>
                </Link>

                <Link
                  to="/combos"
                  className="flex items-center gap-3 px-3 py-3 rounded-md text-foreground hover-elevate active-elevate-2"
                  onClick={closeMenu}
                  data-testid="link-combos-mobile"
                >
                  <Star className="h-5 w-5 text-primary" />
                  <span className="font-medium">Paris Combinés</span>
                </Link>

                <div className="h-px bg-border my-2" />

                <Link
                  to="/pricing"
                  className="flex items-center gap-3 px-3 py-3 rounded-md text-foreground hover-elevate active-elevate-2"
                  onClick={closeMenu}
                  data-testid="link-pricing-mobile"
                >
                  <CreditCard className="h-5 w-5 text-primary" />
                  <span className="font-medium">Tarifs VIP</span>
                </Link>

                <Link
                  to="/account"
                  className="flex items-center gap-3 px-3 py-3 rounded-md text-foreground hover-elevate active-elevate-2"
                  onClick={closeMenu}
                  data-testid="link-account-mobile"
                >
                  <User className="h-5 w-5 text-primary" />
                  <span className="font-medium">Mon Compte</span>
                </Link>

                <Link
                  to="/referral"
                  className="flex items-center gap-3 px-3 py-3 rounded-md text-foreground hover-elevate active-elevate-2"
                  onClick={closeMenu}
                  data-testid="link-referral-mobile"
                >
                  <Gift className="h-5 w-5 text-primary" />
                  <span className="font-medium">Parrainage</span>
                </Link>

                {isAdmin && (
                  <>
                    <div className="h-px bg-border my-2" />
                    <Link
                      to="/admin"
                      className="flex items-center gap-3 px-3 py-3 rounded-md text-primary bg-primary/10 hover-elevate active-elevate-2"
                      onClick={closeMenu}
                      data-testid="link-admin-mobile"
                    >
                      <Settings className="h-5 w-5" />
                      <span className="font-semibold">Administration</span>
                    </Link>
                  </>
                )}

                <div className="h-px bg-border my-2" />

                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-3 py-3 rounded-md text-destructive hover:bg-destructive/10 transition-colors"
                  data-testid="button-logout-mobile"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium">Déconnexion</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/pricing"
                  className="flex items-center gap-3 px-3 py-3 rounded-md text-foreground hover-elevate active-elevate-2"
                  onClick={closeMenu}
                  data-testid="link-pricing-mobile"
                >
                  <CreditCard className="h-5 w-5 text-primary" />
                  <span className="font-medium">Découvrir les Tarifs</span>
                </Link>

                <div className="h-px bg-border my-3" />

                <Link to="/auth/login" onClick={closeMenu} className="block" data-testid="link-login-mobile">
                  <Button variant="outline" className="w-full justify-start gap-2" size="lg">
                    Connexion
                  </Button>
                </Link>

                <Link to="/auth/register" onClick={closeMenu} className="block mt-2" data-testid="link-register-mobile">
                  <Button className="btn-vip w-full justify-start gap-2" size="lg">
                    S'inscrire Gratuitement
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
