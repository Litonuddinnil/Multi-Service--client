import React from 'react';
import LoginView from './LoginView';
import RegisterView from './RegisterView';

interface AuthViewProps {
  initialMode?: 'login' | 'register'; 
  onNavigate?: (view: string, params?: Record<string, any>) => void;
  onSuccess?: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  initialMode = 'login',
  onNavigate,
  onSuccess
}) => {
  if (initialMode === 'register') {
    return <RegisterView onNavigate={onNavigate} onSuccess={onSuccess} />;
  }
  return <LoginView onNavigate={onNavigate} onSuccess={onSuccess} />;
};

export default AuthView;
