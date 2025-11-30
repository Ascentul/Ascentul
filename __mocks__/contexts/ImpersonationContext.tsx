import React from 'react';

export const useImpersonation = () => ({
  impersonation: {
    isImpersonating: false,
    impersonatedUser: null,
  },
  getEffectiveRole: () => 'student',
  getEffectivePlan: () => 'free',
  startImpersonation: jest.fn(),
  stopImpersonation: jest.fn(),
});

export const ImpersonationProvider = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
);
