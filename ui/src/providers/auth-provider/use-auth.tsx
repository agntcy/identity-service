import * as React from 'react';
import AuthContext from './auth-context';

const useAuth = () => {
  const context = React.useContext(AuthContext);

  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useDebugValue(context);
  }

  if (context === undefined) {
    throw new Error('AuthContext value is undefined. Make sure you use the <AuthProvider> before using the context.');
  }

  return context;
};

export default useAuth;
