import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'patients';

    let csvContent = '';
    let fileName = `dentocare_${type}_${new Date().toISOString().split('T')[0]}.csv`;

    if (type === 'patients') {
      const patients = query.getPatients();
      const headers = ['Patient ID', 'Full Name', 'Contact Number', 'Email', 'Date of Birth', 'Gender', 'Emergency Contact', 'Registered Date'];
      const rows = patients.map(p => [
        `"${p.id}"`,
        `"${p.fullName.replace(/"/g, '""')}"`,
        `"${p.contactNumber}"`,
        `"${p.email || ''}"`,
        `"${p.dateOfBirth}"`,
        `"${p.gender}"`,
        `"${p.emergencyContact || ''}"`,
        `"${p.createdAt}"`
      ]);
      csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    } else if (type === 'invoices') {
      const invoices = query.getInvoices();
      const headers = ['Invoice ID', 'Patient Name', 'Status', 'Issue Date', 'Due Date', 'Subtotal (INR)', 'Tax Rate (%)', 'Discount (INR)', 'Total (INR)', 'Paid Amount (INR)'];
      const rows = invoices.map(i => [
        `"${i.id}"`,
        `"${i.patientName.replace(/"/g, '""')}"`,
        `"${i.status}"`,
        `"${i.issueDate}"`,
        `"${i.dueDate}"`,
        i.subtotal,
        i.taxRate,
        i.discount,
        i.total,
        i.paidAmount
      ]);
      csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    } else if (type === 'expenses') {
      const expenses = query.getExpenses();
      const headers = ['Expense ID', 'Title', 'Category', 'Date', 'Amount (INR)', 'Notes'];
      const rows = expenses.map(e => [
        `"${e.id}"`,
        `"${e.name.replace(/"/g, '""')}"`,
        `"${e.category || 'General'}"`,
        `"${e.date}"`,
        e.amount,
        `"${(e.notes || '').replace(/"/g, '""')}"`
      ]);
      csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    } else if (type === 'inventory') {
      const inventory = query.getInventory();
      const headers = ['Item ID', 'Item Name', 'Current Quantity', 'Unit', 'Min Threshold', 'Cost Per Unit (INR)', 'Stock Status'];
      const rows = inventory.map(item => [
        `"${item.id}"`,
        `"${item.name.replace(/"/g, '""')}"`,
        item.quantity,
        `"${item.unit}"`,
        item.minThreshold,
        item.costPerUnit,
        item.quantity <= item.minThreshold ? '"LOW STOCK"' : '"OK"'
      ]);
      csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    } else if (type === 'prescriptions') {
      const prescriptions = query.getPrescriptions();
      const headers = ['Rx ID', 'Patient Name', 'Date', 'Doctor', 'Diagnosis', 'Medications', 'Advice'];
      const rows = prescriptions.map(pr => [
        `"${pr.id}"`,
        `"${pr.patientName.replace(/"/g, '""')}"`,
        `"${pr.date}"`,
        `"${pr.dentistName}"`,
        `"${pr.diagnosis.replace(/"/g, '""')}"`,
        `"${pr.medications.replace(/"/g, '""')}"`,
        `"${(pr.advice || '').replace(/"/g, '""')}"`
      ]);
      csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    } else {
      return NextResponse.json({ success: false, error: 'Invalid export type' }, { status: 400 });
    }

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`
      }
    });
  } catch (error: any) {
    console.error('Error generating export CSV:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
