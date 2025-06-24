import React from 'react';
import {useAuth} from '@/hooks';
import {Loading} from '@/components/ui/loading';
import {IamAPI} from '@/api/services';

export const ApiProvider = ({children}: React.PropsWithChildren) => {
  const [isSet, setIsSet] = React.useState<boolean>(false);
  const {authInfo, tokenExpiredHttpHandler, logout} = useAuth();

  React.useEffect(() => {
    IamAPI.setTokenExpiredHandlers({tokenExpiredHttpHandler, logout});
  }, [tokenExpiredHttpHandler, logout]);

  React.useEffect(() => {
    if (authInfo && authInfo.isAuthenticated) {
      IamAPI.setAuthInfo(authInfo);
      setIsSet(true);
    } else {
      setIsSet(true);
    }
  }, [authInfo]);

  if (!isSet) {
    return <Loading />;
  }

  return <>{children}</>;
};
