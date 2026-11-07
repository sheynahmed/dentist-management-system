import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function GET() {
  try {
    const items = query.getInventory();
    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error('Inventory GET API error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, quantity, minThreshold, unit, costPerUnit } = await request.json();

    if (!name || quantity === undefined || minThreshold === undefined || !unit || costPerUnit === undefined) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    const id = randomUUID();
    
    query.createInventoryItem({
      id,
      name: name.trim(),
      quantity: Number(quantity),
      minThreshold: Number(minThreshold),
      unit: unit.trim(),
      costPerUnit: Number(costPerUnit)
    });

    const newItem = query.getInventoryItemById(id);
    return NextResponse.json({ success: true, message: 'Inventory item added successfully', item: newItem });

  } catch (error) {
    console.error('Inventory POST API error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, name, quantity, minThreshold, unit, costPerUnit } = await request.json();

    if (!id) {
      return NextResponse.json({ success: false, message: 'Inventory item ID is required' }, { status: 400 });
    }

    const item = query.getInventoryItemById(id);
    if (!item) {
      return NextResponse.json({ success: false, message: 'Inventory item not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (quantity !== undefined) updateData.quantity = Number(quantity);
    if (minThreshold !== undefined) updateData.minThreshold = Number(minThreshold);
    if (unit !== undefined) updateData.unit = unit.trim();
    if (costPerUnit !== undefined) updateData.costPerUnit = Number(costPerUnit);

    query.updateInventoryItem(id, updateData);

    const updatedItem = query.getInventoryItemById(id);
    return NextResponse.json({ success: true, message: 'Inventory item updated successfully', item: updatedItem });

  } catch (error) {
    console.error('Inventory PUT API error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Inventory item ID is required' }, { status: 400 });
    }

    const item = query.getInventoryItemById(id);
    if (!item) {
      return NextResponse.json({ success: false, message: 'Inventory item not found' }, { status: 404 });
    }

    query.deleteInventoryItem(id);
    return NextResponse.json({ success: true, message: 'Inventory item deleted successfully' });

  } catch (error) {
    console.error('Inventory DELETE API error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
