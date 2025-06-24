import {IamAPI} from '@/api/services';
import {useQuery} from '@tanstack/react-query';

export const useGetTenants = () => {
  return useQuery({
    queryKey: ['get-tenants'],
    queryFn: async () => {
      const {data} = await IamAPI.getTenants();
      return data;
    }
  });
};
