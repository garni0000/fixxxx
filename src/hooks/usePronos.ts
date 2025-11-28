import { useQuery } from '@tanstack/react-query';
import { supabasePronosService } from '@/lib/supabase-services';

export const usePronos = (date?: string) => {
  return useQuery({
    queryKey: ['pronos', date],
    queryFn: async () => {
      const response = await supabasePronosService.getPronos(date);
      return response.data;
    },
  });
};

export const useProno = (id: string) => {
  return useQuery({
    queryKey: ['prono', id],
    queryFn: async () => {
      const response = await supabasePronosService.getPronoById(id);
      return response.data;
    },
  });
};
