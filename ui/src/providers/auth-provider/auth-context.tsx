import {AuthContextProps} from '@/types/okta';
import * as React from 'react';

const AuthContext = React.createContext<AuthContextProps | undefined>(undefined);
AuthContext.displayName = 'AuthContext';

export default AuthContext;
