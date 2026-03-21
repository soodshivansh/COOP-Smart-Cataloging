import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      role: string;
      twoFactorEnabled: boolean;
      pendingTwoFactor?: boolean;
    };
  }

  interface User {
    id: string;
    email: string;
    role: string;
    twoFactorEnabled: boolean;
    pendingTwoFactor?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    twoFactorEnabled: boolean;
    pendingTwoFactor?: boolean;
  }
}
