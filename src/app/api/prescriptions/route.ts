import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');

    if (patientId) {
      const prescriptions = query.getPrescriptionsByPatientId(patientId);
      return NextResponse.json({ success: true, prescriptions });
    }

    const prescriptions = query.getPrescriptions();
    const patients = query.getPatients();
    return NextResponse.json({ success: true, prescriptions, patients });
  } catch (error: any) {
    console.error('Error fetching prescriptions:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { patientId, dentistName, date, diagnosis, medications, advice } = body;

    if (!patientId || !dentistName || !diagnosis || !medications) {
      return NextResponse.json(
        { success: false, error: 'Patient, Doctor, Diagnosis, and Medications are required.' },
        { status: 400 }
      );
    }

    const id = `rx-${Date.now()}`;
    const medsJson = typeof medications === 'string' ? medications : JSON.stringify(medications);

    query.createPrescription({
      id,
      patientId,
      dentistName,
      date: date || new Date().toISOString().split('T')[0],
      diagnosis,
      medications: medsJson,
      advice: advice || null
    });

    return NextResponse.json({ success: true, id, message: 'Prescription created successfully' });
  } catch (error: any) {
    console.error('Error creating prescription:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Prescription ID is required' }, { status: 400 });
    }

    query.deletePrescription(id);
    return NextResponse.json({ success: true, message: 'Prescription deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting prescription:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
