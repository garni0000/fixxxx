import { Calendar, Sparkles, CreditCard, User, Home } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Accueil', color: 'text-blue-500' },
    { path: '/pronos/today', icon: Calendar, label: 'Pronos', color: 'text-primary' },
    { path: '/combos', icon: Sparkles, label: 'Combos', color: 'text-yellow-500' },
    { path: '/pricing', icon: CreditCard, label: 'Offres', color: 'text-green-500' },
    { path: '/account', icon: User, label: 'Compte', color: 'text-purple-500' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 md:hidden">
      <div className="grid grid-cols-5 gap-1 px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 py-2 rounded-lg hover-elevate active-elevate-2 ${active ? 'bg-primary/10' : ''}`}
              data-testid={`bottom-nav-${item.label.toLowerCase()}`}
            >
              <Icon className={`h-5 w-5 ${active ? item.color : 'text-muted-foreground'}`} />
              <span className={`text-[10px] font-medium ${active ? 'text-foreground' : 'text-muted-foreground'}`}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
