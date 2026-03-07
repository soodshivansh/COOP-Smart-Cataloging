import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export type Role = 'admin' | 'manager' | 'viewer';

const roleHierarchy: Record<Role, number> = {
  admin: 3,
  manager: 2,
  viewer: 1,
};

export function hasPermission(userRole: Role, requiredRole: Role): boolean {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

export async function requireAuth(req: NextRequest, requiredRole?: Role) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (requiredRole && !hasPermission(session.user.role as Role, requiredRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return { user: session.user };
}

export function canEdit(userRole: Role): boolean {
  return hasPermission(userRole, 'manager');
}

export function canDelete(userRole: Role): boolean {
  return hasPermission(userRole, 'manager');
}

export function canManageUsers(userRole: Role): boolean {
  return hasPermission(userRole, 'admin');
}

export function canConfigureSystem(userRole: Role): boolean {
  return hasPermission(userRole, 'admin');
}
