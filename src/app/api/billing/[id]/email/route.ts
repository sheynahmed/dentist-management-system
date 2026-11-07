import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    if (!id) {
      return NextResponse.json({ success: false, message: 'Invoice ID is required' }, { status: 400 });
    }

    const invoice = query.getInvoiceById(id);
    if (!invoice) {
      return NextResponse.json({ success: false, message: 'Invoice not found' }, { status: 404 });
    }

    const patientEmail = invoice.patientEmail;
    if (!patientEmail) {
      return NextResponse.json({ 
        success: false, 
        message: `Patient ${invoice.patientName} does not have an email registered. Cannot send invoice.` 
      }, { status: 400 });
    }

    // Mock Email Send delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    return NextResponse.json({
      success: true,
      message: `Invoice PDF email successfully sent to ${invoice.patientName} (${patientEmail})`
    });

  } catch (error) {
    console.error('Invoice Email API error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
