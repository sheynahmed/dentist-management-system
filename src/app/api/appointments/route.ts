import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const appointments = query.getAppointments();
    const patients = query.getPatients();
    // Filter users to only DENTISTs (or get all users who are dentists)
    const dentists = query.getUsers().filter(u => u.role === 'DENTIST');
    
    return NextResponse.json({ 
      success: true, 
      appointments,
      patients: patients.map(p => ({ id: p.id, fullName: p.fullName, contactNumber: p.contactNumber })),
      dentists: dentists.map(d => ({ id: d.id, name: d.name }))
    });
  } catch (error) {
    console.error('Appointments GET API error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { patientId, dentistId, dateTime, notes } = await request.json();

    if (!patientId || !dentistId || !dateTime) {
      return NextResponse.json({ success: false, message: 'Patient, Dentist and Date/Time are required' }, { status: 400 });
    }

    const id = require('crypto').randomUUID();

    query.createAppointment({
      id,
      patientId,
      dentistId,
      dateTime,
      status: 'SCHEDULED',
      notes: notes || null
    });

    const appointments = query.getAppointments();
    const newAppointment = appointments.find(a => a.id === id);

    return NextResponse.json({ 
      success: true, 
      message: 'Appointment scheduled successfully', 
      appointment: newAppointment 
    });
  } catch (error) {
    console.error('Appointments POST API error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, status } = await request.json();

    if (!id || !status || !['SCHEDULED', 'COMPLETED', 'CANCELLED'].includes(status)) {
      return NextResponse.json({ success: false, message: 'ID and valid status are required' }, { status: 400 });
    }

    query.updateAppointmentStatus(id, status);

    return NextResponse.json({ 
      success: true, 
      message: `Appointment status updated to ${status}` 
    });
  } catch (error) {
    console.error('Appointments PUT API error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Appointment ID is required' }, { status: 400 });
    }

    query.deleteAppointment(id);

    return NextResponse.json({ 
      success: true, 
      message: 'Appointment deleted successfully' 
    });
  } catch (error) {
    console.error('Appointments DELETE API error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
