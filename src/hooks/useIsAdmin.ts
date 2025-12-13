import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useIsAdmin = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const adminEmailsString = import.meta.env.VITE_ADMIN_EMAILS || '';
      const adminEmails = adminEmailsString.split(',').map((email: string) => email.trim());
      
      const userIsAdmin = adminEmails.includes(user.email || '');
      setIsAdmin(userIsAdmin);
      setLoading(false);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
      setLoading(false);
    }
  };

  return { isAdmin, loading };
};
