import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface NotificationPermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationPermissionDialog({ open, onOpenChange }: NotificationPermissionDialogProps) {
  const { isSupported, subscribe, isLoading } = usePushNotifications();

  if (!isSupported) {
    return null;
  }

  const handleAccept = async () => {
    await subscribe();
    onOpenChange(false);
  };

  const handleDecline = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Bell className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl">
            Restez informé des nouveaux pronos !
          </DialogTitle>
          <DialogDescription className="text-center">
            Activez les notifications pour recevoir une alerte dès que de nouveaux pronostics sont publiés. Ne ratez plus aucune opportunité !
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 mt-4">
          <Button 
            onClick={handleAccept} 
            className="btn-vip w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Activation...' : 'Activer les notifications'}
          </Button>
          <Button 
            onClick={handleDecline} 
            variant="ghost" 
            className="w-full text-muted-foreground"
          >
            Plus tard
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
