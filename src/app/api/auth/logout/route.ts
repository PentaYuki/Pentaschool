import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // Get refresh token from cookies
    const refreshToken = request.cookies.get('refreshToken')?.value;

    // Try to revoke token if it exists
    if (refreshToken) {
      try {
        const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
        await prisma.refreshToken.updateMany({
          where: { token: tokenHash },
          data: { isRevoked: true },
        });
      } catch (error) {
        console.error('Error revoking token:', error);
        // Continue with logout even if revocation fails
      }
    }

    // Create response to clear cookies
    const response = NextResponse.json(
      {
        success: true,
        message: 'Đăng xuất thành công',
      },
      { status: 200 }
    );

    // Clear authentication cookies
    response.cookies.set('refreshToken', '', {
      httpOnly: true,
      maxAge: 0, // Expire immediately
      path: '/',
    });

    response.cookies.set('access_token', '', {
      httpOnly: true,
      maxAge: 0,
      path: '/',
    });

    response.cookies.set('user', '', {
      httpOnly: false,
      maxAge: 0, // Expire immediately
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    // Return success anyway to clear client-side auth
    const response = NextResponse.json(
      {
        success: true,
        message: 'Đăng xuất thành công',
      },
      { status: 200 }
    );

    response.cookies.set('refreshToken', '', {
      httpOnly: true,
      maxAge: 0,
      path: '/',
    });

    response.cookies.set('access_token', '', {
      httpOnly: true,
      maxAge: 0,
      path: '/',
    });

    response.cookies.set('user', '', {
      httpOnly: false,
      maxAge: 0,
      path: '/',
    });

    return response;
  }
}
