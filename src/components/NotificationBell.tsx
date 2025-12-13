import { Bell, BellOff, BellRing, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useToast } from '@/hooks/use-toast';

export function NotificationBell() {
  const { isSupported, isSubscribed, isLoading, permission, subscribe, unsubscribe, error } = usePushNotifications();
  const { toast } = useToast();

  if (!isSupported) {
    return null;
  }

  const handleClick = async () => {
    if (isLoading) return;

    if (isSubscribed) {
      const success = await unsubscribe();
      if (success) {
        toast({
          title: 'Notifications désactivées',
          description: 'Vous ne recevrez plus de notifications pour les nouveaux pronos.',
        });
      }
    } else {
      const success = await subscribe();
      if (success) {
        toast({
          title: 'Notifications activées',
          description: 'Vous serez notifié dès que de nouveaux pronos sont publiés!',
        });
      } else if (error) {
        toast({
          title: 'Erreur',
          description: error,
          variant: 'destructive',
        });
      }
    }
  };

  const getTooltipText = () => {
    if (isLoading) return 'Chargement...';
    if (permission === 'denied') return 'Notifications bloquées dans le navigateur';
    if (isSubscribed) return 'Désactiver les notifications';
    return 'Activer les notifications';
  };

  const getIcon = () => {
    if (isLoading) return <Loader2 className="h-5 w-5 animate-spin" />;
    if (permission === 'denied') return <BellOff className="h-5 w-5 text-muted-foreground" />;
    if (isSubscribed) return <BellRing className="h-5 w-5 text-yellow-500" />;
    return <Bell className="h-5 w-5" />;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClick}
            disabled={isLoading || permission === 'denied'}
            className="relative"
          >
            {getIcon()}
            {isSubscribed && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-yellow-500" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getTooltipText()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
