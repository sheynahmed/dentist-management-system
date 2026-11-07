import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');

    const notes = query.getClinicalNotes(patientId || undefined);
    const patients = query.getPatients();
    return NextResponse.json({ success: true, notes, patients });
  } catch (error: any) {
    console.error('Error fetching clinical notes:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { patientId, dentistName, date, toothNumber, chiefComplaint, clinicalFindings, procedureDone, nextVisitPlan } = body;

    if (!patientId || !dentistName || !chiefComplaint || !procedureDone) {
      return NextResponse.json(
        { success: false, error: 'Patient, Doctor, Chief Complaint, and Procedure Done are required.' },
        { status: 400 }
      );
    }

    const id = `cn-${Date.now()}`;
    query.createClinicalNote({
      id,
      patientId,
      dentistName,
      date: date || new Date().toISOString().split('T')[0],
      toothNumber: toothNumber || null,
      chiefComplaint,
      clinicalFindings: clinicalFindings || null,
      procedureDone,
      nextVisitPlan: nextVisitPlan || null
    });

    return NextResponse.json({ success: true, id, message: 'Clinical note logged successfully' });
  } catch (error: any) {
    console.error('Error creating clinical note:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Note ID is required' }, { status: 400 });
    }

    query.deleteClinicalNote(id);
    return NextResponse.json({ success: true, message: 'Note deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting clinical note:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
