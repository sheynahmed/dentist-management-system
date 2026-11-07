import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const invoices = query.getInvoices();
    const paidInvoices = invoices.filter(inv => inv.status === 'PAID');
    
    const specialistData: Record<string, { totalRevenue: number; commission: number; treatments: any[] }> = {
      orthodontist: { totalRevenue: 0, commission: 0, treatments: [] },
      endodontist: { totalRevenue: 0, commission: 0, treatments: [] },
      periodontist: { totalRevenue: 0, commission: 0, treatments: [] }
    };

    paidInvoices.forEach(invoice => {
      const items = query.getInvoiceItems(invoice.id);
      items.forEach(item => {
        const name = item.treatmentName.toLowerCase();
        let specialist: string | null = null;
        
        if (name.includes('ortho') || name.includes('brace') || name.includes('invisalign') || name.includes('aligner')) {
          specialist = 'orthodontist';
        } else if (name.includes('rct') || name.includes('root canal') || name.includes('endo') || name.includes('pulpectomy')) {
          specialist = 'endodontist';
        } else if (name.includes('perio') || name.includes('scaling') || name.includes('gum') || name.includes('flap') || name.includes('periodontist')) {
          specialist = 'periodontist';
        }

        if (specialist) {
          const itemRevenue = item.cost * item.quantity;
          const commissionAmount = itemRevenue * 0.40; // 40% split
          
          specialistData[specialist].totalRevenue += itemRevenue;
          specialistData[specialist].commission += commissionAmount;
          specialistData[specialist].treatments.push({
            invoiceId: invoice.id,
            patientName: invoice.patientName,
            treatmentName: item.treatmentName,
            date: invoice.issueDate,
            amount: itemRevenue,
            commission: commissionAmount
          });
        }
      });
    });

    return NextResponse.json({ success: true, commissions: specialistData });
  } catch (error) {
    console.error('Commissions GET API error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
