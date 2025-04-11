
import { createContext } from 'react';
import { AuthContextType } from '@/types';

// Create the Auth Context with a default undefined value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export default AuthContext;
