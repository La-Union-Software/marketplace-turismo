import { NextResponse } from 'next/server';

// For now, we'll only support Argentina
const countries = [
  {
    id: 'AR',
    name: 'Argentina',
    code: 'AR'
  }
];

export async function GET() {
  try {
    return NextResponse.json(countries);
  } catch (error) {
    console.error('Error fetching countries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch countries' },
      { status: 500 }
    );
  }
}
