import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, generateAccessToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // Get refresh token from cookies
    const refreshToken = request.cookies.get('refreshToken')?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, error: 'Refresh token không được tìm thấy' },
        { status: 401 }
      );
    }

    // Verify refresh token
    const decoded = verifyToken(refreshToken, 'refresh');
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'Refresh token không hợp lệ hoặc đã hết hạn' },
        { status: 401 }
      );
    }

    // Check if refresh token is revoked in DB
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: tokenHash },
    });

    if (!storedToken || storedToken.isRevoked) {
      return NextResponse.json(
        { success: false, error: 'Refresh token đã bị thu hồi' },
        { status: 401 }
      );
    }

    // Verify token hasn't expired
    if (new Date() > storedToken.expiresAt) {
      return NextResponse.json(
        { success: false, error: 'Refresh token đã hết hạn' },
        { status: 401 }
      );
    }

    // Fetch user details
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Người dùng không tồn tại' },
        { status: 401 }
      );
    }

    // Generate new access token
    const newAccessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Return new access token and rotate access cookie
    const response = NextResponse.json(
      {
        success: true,
        message: 'Token làm mới thành công',
        accessToken: newAccessToken,
      },
      { status: 200 }
    );

    response.cookies.set('access_token', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 15, // 15 minutes
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Refresh token error:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi làm mới token' },
      { status: 500 }
    );
  }
}
