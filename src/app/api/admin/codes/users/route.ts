// app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function getRequestRole(request: NextRequest): string | null {
  const roleFromHeader = request.headers.get('x-user-role');
  if (roleFromHeader) {
    return roleFromHeader;
  }

  const userCookie = request.cookies.get('user');
  if (!userCookie) {
    return null;
  }

  try {
    const user = JSON.parse(decodeURIComponent(userCookie.value));
    return typeof user?.role === 'string' ? user.role : null;
  } catch {
    try {
      const user = JSON.parse(userCookie.value);
      return typeof user?.role === 'string' ? user.role : null;
    } catch {
      return null;
    }
  }
}

/**
 * GET /api/admin/users
 * Trả về toàn bộ danh sách tài khoản cho AdminDashboard.
 * Chỉ ADMIN mới được gọi (kiểm tra qua header x-user-role hoặc session).
 */
export async function GET(request: NextRequest) {
  try {
    const role = getRequestRole(request);
    if (!role) {
      return NextResponse.json({ error: 'Chưa xác thực' }, { status: 401 });
    }
    if (role !== 'ADMIN') {
      return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        className: true,
        createdAt: true,
        school: { select: { name: true } },
      },
      orderBy: [{ role: 'asc' }, { createdAt: 'desc' }],
    });

    const result = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      isActive: u.isActive,
      className: u.className || '',
      schoolName: u.school?.name || '',
      createdAt: u.createdAt.toISOString(),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('[GET /api/admin/users]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * PATCH /api/admin/users
 * Body: { id, isActive?, role? }
 * Kích hoạt / đổi role tài khoản.
 */
export async function PATCH(request: NextRequest) {
  try {
    const role = getRequestRole(request);
    if (!role) {
      return NextResponse.json({ error: 'Chưa xác thực' }, { status: 401 });
    }
    if (role !== 'ADMIN') {
      return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
    }

    const { id, isActive, role: nextRole } = await request.json();
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(typeof isActive === 'boolean' ? { isActive } : {}),
        ...(nextRole ? { role: nextRole } : {}),
      },
      select: { id: true, name: true, role: true, isActive: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[PATCH /api/admin/users]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}