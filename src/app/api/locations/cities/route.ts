import { NextResponse } from 'next/server';
import { argentinaCities } from '@/data/argentinaCities';
import { externalLocationService } from '@/services/externalLocationService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const stateCode = searchParams.get('state');
    const search = searchParams.get('search');
    const useExternal = searchParams.get('external') === 'true';
    const limit = parseInt(searchParams.get('limit') || '100');

    if (!stateCode) {
      return NextResponse.json(
        { error: 'State code is required' },
        { status: 400 }
      );
    }

    let cities;

    if (useExternal) {
      // Use external API for comprehensive city data
      try {
        const externalCities = await externalLocationService.getCitiesWithFallback('AR', stateCode);
        cities = externalCities.map(city => ({
          id: city.id,
          name: city.name,
          code: city.stateCode + '-' + city.name.substring(0, 3).toUpperCase()
        }));
      } catch (externalError) {
        console.warn('External API failed, falling back to local data:', externalError.message);
        cities = argentinaCities[stateCode as keyof typeof argentinaCities] || [];
      }
    } else {
      // Use local database
      cities = argentinaCities[stateCode as keyof typeof argentinaCities] || [];
    }

    // Filter cities by search term if provided
    if (search) {
      cities = cities.filter(city => 
        city.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Limit results for performance
    cities = cities.slice(0, limit);

    return NextResponse.json({
      cities,
      total: cities.length,
      source: useExternal ? 'external' : 'local',
      state: stateCode
    });
  } catch (error) {
    console.error('Error fetching cities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cities' },
      { status: 500 }
    );
  }
}
