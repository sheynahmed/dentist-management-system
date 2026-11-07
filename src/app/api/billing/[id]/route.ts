import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const invoice = query.getInvoiceById(id);
    
    if (!invoice) {
      return NextResponse.json({ success: false, message: 'Invoice not found' }, { status: 404 });
    }

    const items = query.getInvoiceItems(id);
    const linkedExpenses = query.getExpensesByInvoiceId(id);

    return NextResponse.json({
      success: true,
      invoice,
      items,
      linkedExpenses
    });
  } catch (error) {
    console.error('Invoice GET API error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
