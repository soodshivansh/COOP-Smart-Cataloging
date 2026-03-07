import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function createUser(email: string, password: string, role: 'admin' | 'manager' | 'viewer' = 'viewer') {
  const passwordHash = await hashPassword(password);
  
  return prisma.user.create({
    data: {
      email,
      passwordHash,
      role,
    },
  });
}

export function checkPermission(userRole: string, requiredRole: 'admin' | 'manager' | 'viewer'): boolean {
  const roleHierarchy = {
    admin: 3,
    manager: 2,
    viewer: 1,
  };

  return roleHierarchy[userRole as keyof typeof roleHierarchy] >= roleHierarchy[requiredRole];
}
