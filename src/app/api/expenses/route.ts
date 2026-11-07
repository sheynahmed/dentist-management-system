import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function GET() {
  try {
    const expenses = query.getExpenses();
    return NextResponse.json({ success: true, expenses });
  } catch (error) {
    console.error('Expenses GET API error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
        const { name, amount, date, category, notes, invoiceId } = await request.json();

    if (!name || amount === undefined || !date || !category) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    const id = randomUUID();
    
    query.createExpense({
      id,
      name: name.trim().toLowerCase(),
      amount: Number(amount),
      date,
      category,
      notes: notes ? notes.trim() : null,
      invoiceId: invoiceId || null
    });

    const newExpense = query.getExpenseById(id);
    return NextResponse.json({ success: true, message: 'Expense logged successfully', expense: newExpense });

  } catch (error) {
    console.error('Expenses POST API error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, name, amount, date, category, notes, invoiceId } = await request.json();

    if (!id) {
      return NextResponse.json({ success: false, message: 'Expense ID is required' }, { status: 400 });
    }

    const expense = query.getExpenseById(id);
    if (!expense) {
      return NextResponse.json({ success: false, message: 'Expense not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim().toLowerCase();
    if (amount !== undefined) updateData.amount = Number(amount);
    if (date !== undefined) updateData.date = date;
    if (category !== undefined) updateData.category = category;
    if (notes !== undefined) updateData.notes = notes ? notes.trim() : null;
    if (invoiceId !== undefined) updateData.invoiceId = invoiceId;

    query.updateExpense(id, updateData);

    const updatedExpense = query.getExpenseById(id);
    return NextResponse.json({ success: true, message: 'Expense updated successfully', expense: updatedExpense });

  } catch (error) {
    console.error('Expenses PUT API error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Expense ID is required' }, { status: 400 });
    }

    const expense = query.getExpenseById(id);
    if (!expense) {
      return NextResponse.json({ success: false, message: 'Expense not found' }, { status: 404 });
    }

    query.deleteExpense(id);

    return NextResponse.json({ success: true, message: 'Expense deleted successfully' });

  } catch (error) {
    console.error('Expenses DELETE API error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
