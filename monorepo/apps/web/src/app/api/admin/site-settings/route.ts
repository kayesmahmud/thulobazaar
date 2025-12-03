import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireSuperAdmin } from '@/lib/jwt';

/**
 * GET /api/admin/site-settings
 * Get site settings (super admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate super admin
    await requireSuperAdmin(request);

    const settings = await prisma.site_settings.findMany();

    const settingsMap: Record<string, any> = {};
    settings.forEach((s) => {
      let value: any = s.setting_value;

      // Parse based on type
      if (s.setting_type === 'boolean') {
        value = s.setting_value === 'true';
      } else if (s.setting_type === 'number') {
        value = parseInt(s.setting_value || '0');
      } else if (s.setting_type === 'json') {
        try {
          value = JSON.parse(s.setting_value || '{}');
        } catch {
          value = s.setting_value;
        }
      }

      settingsMap[s.setting_key] = {
        id: s.id,
        value,
        type: s.setting_type,
        description: s.description,
      };
    });

    return NextResponse.json({
      success: true,
      data: settingsMap,
    });
  } catch (error: any) {
    console.error('Get site settings error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    if (error.message.includes('Forbidden')) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Failed to fetch site settings' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/site-settings
 * Update a site setting (super admin only)
 */
export async function PUT(request: NextRequest) {
  try {
    // Authenticate super admin
    await requireSuperAdmin(request);

    const body = await request.json();
    const { settingKey, value } = body;

    if (!settingKey) {
      return NextResponse.json(
        { success: false, message: 'Setting key is required' },
        { status: 400 }
      );
    }

    // Get existing setting to determine type
    const existing = await prisma.site_settings.findUnique({
      where: { setting_key: settingKey },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Setting not found' },
        { status: 404 }
      );
    }

    // Convert value to string based on type
    let stringValue: string;
    if (existing.setting_type === 'json') {
      stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    } else if (existing.setting_type === 'boolean') {
      stringValue = value ? 'true' : 'false';
    } else {
      stringValue = String(value);
    }

    const updated = await prisma.site_settings.update({
      where: { setting_key: settingKey },
      data: {
        setting_value: stringValue,
        updated_at: new Date(),
      },
    });

    console.log(`✅ Site setting updated: ${settingKey} = ${stringValue}`);

    return NextResponse.json({
      success: true,
      data: {
        key: updated.setting_key,
        value: stringValue,
        type: updated.setting_type,
      },
    });
  } catch (error: any) {
    console.error('Update site setting error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    if (error.message.includes('Forbidden')) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Failed to update site setting' },
      { status: 500 }
    );
  }
}
