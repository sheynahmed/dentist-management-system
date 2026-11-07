import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const treatments = query.getTreatments();
    return NextResponse.json({ success: true, treatments });
  } catch (error) {
    console.error('Treatments GET API error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, cost } = await request.json();

    if (!id || cost === undefined || cost === null || isNaN(Number(cost)) || Number(cost) < 0) {
      return NextResponse.json({ success: false, message: 'Valid ID and cost are required' }, { status: 400 });
    }

    const treatment = query.getTreatmentById(id);
    if (!treatment) {
      return NextResponse.json({ success: false, message: 'Treatment not found' }, { status: 404 });
    }

    query.updateTreatment(id, Number(cost));

    const updatedTreatment = query.getTreatmentById(id);
    return NextResponse.json({ success: true, message: 'Treatment cost updated successfully', treatment: updatedTreatment });
  } catch (error) {
    console.error('Treatments PUT API error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
