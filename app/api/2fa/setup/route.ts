import { NextRequest, NextResponse } from 'next/server';
import * as OTPAuth from 'otpauth';
import qrcode from 'qrcode';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: generate a new secret + QR code
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const secret = new OTPAuth.Secret();
  const totp = new OTPAuth.TOTP({
    issuer: 'SmartCatalog',
    label: session.user.email,
    secret,
    digits: 6,
    period: 30,
  });

  const otpauthUrl = totp.toString();
  const qrDataUrl = await qrcode.toDataURL(otpauthUrl);

  await prisma.user.update({
    where: { id: session.user.id },
    data: { twoFactorSecret: secret.base32 } as any,
  });

  return NextResponse.json({ qrDataUrl, secret: secret.base32 });
}

// POST: verify code and enable 2FA
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { code } = await req.json();
  const user = await prisma.user.findUnique({ where: { id: session.user.id } }) as any;

  if (!user?.twoFactorSecret) {
    return NextResponse.json({ error: 'No secret found, start setup again' }, { status: 400 });
  }

  const totp = new OTPAuth.TOTP({ secret: user.twoFactorSecret, digits: 6, period: 30 });
  const delta = totp.validate({ token: code, window: 1 });

  if (delta === null) return NextResponse.json({ error: 'Invalid code' }, { status: 400 });

  await prisma.user.update({
    where: { id: user.id },
    data: { twoFactorEnabled: true } as any,
  });

  return NextResponse.json({ success: true });
}

// DELETE: disable 2FA
export async function DELETE() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { twoFactorEnabled: false, twoFactorSecret: null } as any,
  });

  return NextResponse.json({ success: true });
}
