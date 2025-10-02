import { NextResponse } from 'next/server';

// Argentina states/provinces
const argentinaStates = [
  { id: 'CABA', name: 'Ciudad Autónoma de Buenos Aires', code: 'CABA' },
  { id: 'BA', name: 'Buenos Aires', code: 'BA' },
  { id: 'CT', name: 'Catamarca', code: 'CT' },
  { id: 'CC', name: 'Chaco', code: 'CC' },
  { id: 'CH', name: 'Chubut', code: 'CH' },
  { id: 'CB', name: 'Córdoba', code: 'CB' },
  { id: 'CR', name: 'Corrientes', code: 'CR' },
  { id: 'ER', name: 'Entre Ríos', code: 'ER' },
  { id: 'FO', name: 'Formosa', code: 'FO' },
  { id: 'JY', name: 'Jujuy', code: 'JY' },
  { id: 'LP', name: 'La Pampa', code: 'LP' },
  { id: 'LR', name: 'La Rioja', code: 'LR' },
  { id: 'MZ', name: 'Mendoza', code: 'MZ' },
  { id: 'MN', name: 'Misiones', code: 'MN' },
  { id: 'NQ', name: 'Neuquén', code: 'NQ' },
  { id: 'RN', name: 'Río Negro', code: 'RN' },
  { id: 'SA', name: 'Salta', code: 'SA' },
  { id: 'SJ', name: 'San Juan', code: 'SJ' },
  { id: 'SL', name: 'San Luis', code: 'SL' },
  { id: 'SC', name: 'Santa Cruz', code: 'SC' },
  { id: 'SF', name: 'Santa Fe', code: 'SF' },
  { id: 'SE', name: 'Santiago del Estero', code: 'SE' },
  { id: 'TF', name: 'Tierra del Fuego', code: 'TF' },
  { id: 'TM', name: 'Tucumán', code: 'TM' }
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const countryCode = searchParams.get('country');

    if (!countryCode) {
      return NextResponse.json(
        { error: 'Country code is required' },
        { status: 400 }
      );
    }

    if (countryCode === 'AR') {
      return NextResponse.json(argentinaStates);
    }

    return NextResponse.json([]);
  } catch (error) {
    console.error('Error fetching states:', error);
    return NextResponse.json(
      { error: 'Failed to fetch states' },
      { status: 500 }
    );
  }
}
