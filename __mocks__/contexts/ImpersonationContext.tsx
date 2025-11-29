import React from 'react';

export const useImpersonation = () => ({
  isImpersonating: false,
  impersonatedUser: null,
  getEffectiveRole: () => 'student',
  startImpersonation: jest.fn(),
  stopImpersonation: jest.fn(),
});

export const ImpersonationProvider = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
);
