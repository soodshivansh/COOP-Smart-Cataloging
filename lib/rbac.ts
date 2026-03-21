import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export type Role = 'admin' | 'viewer';

const roleHierarchy: Record<Role, number> = {
  admin: 2,
  viewer: 1,
};

export function hasPermission(userRole: string, requiredRole: Role): boolean {
  return (roleHierarchy[userRole as Role] ?? 0) >= roleHierarchy[requiredRole];
}

export async function requireAuth(req: NextRequest, requiredRole?: Role) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.user.pendingTwoFactor) {
    return NextResponse.json({ error: 'Complete 2FA verification first' }, { status: 401 });
  }

  if (requiredRole && !hasPermission(session.user.role, requiredRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return { user: session.user };
}

export function canUpload(userRole: string): boolean {
  return hasPermission(userRole, 'admin');
}

export function canDelete(userRole: string): boolean {
  return hasPermission(userRole, 'admin');
}
