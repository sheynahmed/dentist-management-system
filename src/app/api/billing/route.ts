import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const invoices = query.getInvoices();
    const patients = query.getPatients();
    const treatments = query.getTreatments();

    return NextResponse.json({
      success: true,
      invoices,
      patients: patients.map(p => ({ id: p.id, fullName: p.fullName })),
      treatments: treatments.map(t => ({ id: t.id, name: t.name, cost: t.cost }))
    });
  } catch (error) {
    console.error('Billing GET API error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { patientId, status, dueDate, taxRate, discount, items } = await request.json();

    if (!patientId || !status || !dueDate || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, message: 'Missing required fields or items list' }, { status: 400 });
    }

    // Calculate subtotal from items
    let subtotal = 0;
    const invoiceItems = items.map(item => {
      const treatment = query.getTreatmentById(item.treatmentId);
      if (!treatment) {
        throw new Error(`Treatment not found: ${item.treatmentId}`);
      }
      const itemCost = treatment.cost; // Use official cost or user custom cost
      const qty = parseInt(item.quantity) || 1;
      const totalCost = itemCost * qty;
      subtotal += totalCost;

      return {
        id: require('crypto').randomUUID(),
        treatmentId: item.treatmentId,
        quantity: qty,
        cost: itemCost
      };
    });

    const tax = parseFloat(taxRate) || 0;
    const disc = parseFloat(discount) || 0;
    
    // Total calculation: subtotal + tax - discount
    // tax is percent, discount is absolute amount
    const taxAmount = subtotal * (tax / 100);
    const total = Math.max(0, subtotal + taxAmount - disc);
    const paidAmount = status === 'PAID' ? total : 0;

    const invoiceId = require('crypto').randomUUID();
    const issueDate = new Date().toISOString().split('T')[0];

    query.createInvoice(
      {
        id: invoiceId,
        patientId,
        status,
        issueDate,
        dueDate,
        taxRate: tax,
        discount: disc,
        subtotal,
        total,
        paidAmount
      },
      invoiceItems
    );

    const invoices = query.getInvoices();
    const newInvoice = invoices.find(i => i.id === invoiceId);

    return NextResponse.json({
      success: true,
      message: 'Invoice created successfully',
      invoice: newInvoice
    });

  } catch (error: any) {
    console.error('Billing POST API error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, status } = await request.json();

    if (!id || !status || !['PENDING', 'PAID'].includes(status)) {
      return NextResponse.json({ success: false, message: 'Invoice ID and status (PENDING or PAID) are required' }, { status: 400 });
    }

    const invoice = query.getInvoiceById(id);
    if (!invoice) {
      return NextResponse.json({ success: false, message: 'Invoice not found' }, { status: 404 });
    }

    const paidAmount = status === 'PAID' ? invoice.total : 0;
    query.updateInvoiceStatus(id, status, paidAmount);

    return NextResponse.json({
      success: true,
      message: `Invoice marked as ${status}`
    });
  } catch (error) {
    console.error('Billing PUT API error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Invoice ID is required' }, { status: 400 });
    }

    query.deleteInvoice(id);

    return NextResponse.json({
      success: true,
      message: 'Invoice deleted successfully'
    });
  } catch (error) {
    console.error('Billing DELETE API error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
