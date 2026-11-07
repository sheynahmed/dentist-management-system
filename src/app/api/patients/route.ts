import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function GET() {
  try {
    const patients = query.getPatients();
    return NextResponse.json({ success: true, patients });
  } catch (error) {
    console.error('Patients GET API error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { fullName, dateOfBirth, gender, contactNumber, email, emergencyContact, medicalHistory } = await request.json();

    if (!fullName || !dateOfBirth || !gender || !contactNumber || !emergencyContact) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    // Generate a random UUID for patient
    const id = randomUUID();
    
    // Save medical history as JSON string
    const historyStr = JSON.stringify(medicalHistory || { allergies: [], chronicConditions: [], notes: '' });

    query.createPatient({
      id,
      fullName: fullName.trim(),
      dateOfBirth,
      gender,
      contactNumber: contactNumber.trim(),
      email: email ? email.trim() : null,
      emergencyContact: emergencyContact.trim(),
      medicalHistory: historyStr
    });

    const newPatient = query.getPatientById(id);
    return NextResponse.json({ success: true, message: 'Patient registered successfully', patient: newPatient });

  } catch (error) {
    console.error('Patients POST API error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, fullName, dateOfBirth, gender, contactNumber, email, emergencyContact, medicalHistory } = await request.json();

    if (!id) {
      return NextResponse.json({ success: false, message: 'Patient ID is required' }, { status: 400 });
    }

    const patient = query.getPatientById(id);
    if (!patient) {
      return NextResponse.json({ success: false, message: 'Patient not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (fullName !== undefined) updateData.fullName = fullName.trim();
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;
    if (gender !== undefined) updateData.gender = gender;
    if (contactNumber !== undefined) updateData.contactNumber = contactNumber.trim();
    if (email !== undefined) updateData.email = email ? email.trim() : null;
    if (emergencyContact !== undefined) updateData.emergencyContact = emergencyContact.trim();
    if (medicalHistory !== undefined) updateData.medicalHistory = JSON.stringify(medicalHistory);

    query.updatePatient(id, updateData);

    const updatedPatient = query.getPatientById(id);
    return NextResponse.json({ success: true, message: 'Patient updated successfully', patient: updatedPatient });

  } catch (error) {
    console.error('Patients PUT API error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
