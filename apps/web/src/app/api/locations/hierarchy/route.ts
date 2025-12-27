import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';

/**
 * GET /api/locations/hierarchy
 * Fetch location hierarchy (provinces with districts and municipalities)
 */
export async function GET(request: NextRequest) {
  try {
    // Fetch all provinces
    const provinces = await prisma.locations.findMany({
      where: {
        type: 'province',
      },
      select: {
        id: true,
        name: true,
        type: true,
        slug: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Fetch all districts
    const districts = await prisma.locations.findMany({
      where: {
        type: 'district',
      },
      select: {
        id: true,
        name: true,
        type: true,
        slug: true,
        parent_id: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Fetch all municipalities
    const municipalities = await prisma.locations.findMany({
      where: {
        type: 'municipality',
      },
      select: {
        id: true,
        name: true,
        type: true,
        slug: true,
        parent_id: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Build hierarchy structure
    const hierarchy = provinces.map((province) => {
      // Get districts for this province
      const provinceDistricts = districts
        .filter((district) => district.parent_id === province.id)
        .map((district) => {
          // Get municipalities for this district
          const districtMunicipalities = municipalities.filter(
            (municipality) => municipality.parent_id === district.id
          );

          return {
            ...district,
            children: districtMunicipalities,
          };
        });

      return {
        ...province,
        children: provinceDistricts,
      };
    });

    return NextResponse.json({
      success: true,
      data: hierarchy,
    });
  } catch (error) {
    console.error('Locations hierarchy fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch location hierarchy',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
