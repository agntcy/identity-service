import {SettingsAPI} from '@/api/services';
import {useQuery} from '@tanstack/react-query';

export const useGetSettings = () => {
  return useQuery({
    queryKey: ['get-settings'],
    queryFn: async () => {
      const {data} = await SettingsAPI.getSettings();
      return data;
    }
  });
};
