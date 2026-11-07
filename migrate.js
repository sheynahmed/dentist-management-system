const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'dev.db');
console.log(`Connecting to database at: ${dbPath}`);
const db = new Database(dbPath);

try {
  // 1. Create Inventory table
  console.log('Creating Inventory table if it does not exist...');
  db.prepare(`
    CREATE TABLE IF NOT EXISTS Inventory (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      quantity REAL NOT NULL,
      minThreshold REAL NOT NULL,
      unit TEXT NOT NULL,
      costPerUnit REAL NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `).run();

  // Create Prescription table
  console.log('Creating Prescription table if it does not exist...');
  db.prepare(`
    CREATE TABLE IF NOT EXISTS Prescription (
      id TEXT PRIMARY KEY,
      patientId TEXT NOT NULL,
      dentistName TEXT NOT NULL,
      date TEXT NOT NULL,
      diagnosis TEXT NOT NULL,
      medications TEXT NOT NULL,
      advice TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `).run();

  // Create ClinicalNote table
  console.log('Creating ClinicalNote table if it does not exist...');
  db.prepare(`
    CREATE TABLE IF NOT EXISTS ClinicalNote (
      id TEXT PRIMARY KEY,
      patientId TEXT NOT NULL,
      dentistName TEXT NOT NULL,
      date TEXT NOT NULL,
      toothNumber TEXT,
      chiefComplaint TEXT NOT NULL,
      clinicalFindings TEXT,
      procedureDone TEXT NOT NULL,
      nextVisitPlan TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `).run();

  // 2. Check if invoiceId column exists in Expense table
  console.log('Checking Expense table schema...');
  const tableInfo = db.prepare("PRAGMA table_info(Expense)").all();
  const hasInvoiceId = tableInfo.some(column => column.name === 'invoiceId');

  if (!hasInvoiceId) {
    console.log('Adding invoiceId column to Expense table...');
    db.prepare('ALTER TABLE Expense ADD COLUMN invoiceId TEXT').run();
    console.log('Column invoiceId added successfully.');
  } else {
    console.log('invoiceId column already exists in Expense table.');
  }

  // 3. Seed Inventory data if table is empty
  const countRow = db.prepare('SELECT COUNT(*) as count FROM Inventory').get();
  if (countRow.count === 0) {
    console.log('Seeding initial inventory data...');
    const now = new Date().toISOString();
    const seedItems = [
      { id: 'inv-1', name: 'Latex Gloves', quantity: 500, minThreshold: 100, unit: 'pcs', costPerUnit: 0.1 },
      { id: 'inv-2', name: 'Composites (Resin)', quantity: 20, minThreshold: 5, unit: 'tubes', costPerUnit: 25.0 },
      { id: 'inv-3', name: 'Anesthetics (Articaine)', quantity: 120, minThreshold: 30, unit: 'cartridges', costPerUnit: 1.5 },
      { id: 'inv-4', name: 'Alginate Impression Material', quantity: 15, minThreshold: 5, unit: 'bags', costPerUnit: 12.0 },
      { id: 'inv-5', name: 'Needle Tips 27G', quantity: 300, minThreshold: 50, unit: 'pcs', costPerUnit: 0.05 },
      { id: 'inv-6', name: 'Dental Cotton Rolls', quantity: 1000, minThreshold: 200, unit: 'pcs', costPerUnit: 0.02 },
      { id: 'inv-7', name: 'Sterilization Pouches', quantity: 80, minThreshold: 100, unit: 'pcs', costPerUnit: 0.15 }, // deliberately low to trigger alert
      { id: 'inv-8', name: 'Prophy Paste', quantity: 2, minThreshold: 3, unit: 'jars', costPerUnit: 18.0 } // deliberately low to trigger alert
    ];

    const insertStmt = db.prepare(`
      INSERT INTO Inventory (id, name, quantity, minThreshold, unit, costPerUnit, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction(() => {
      for (const item of seedItems) {
        insertStmt.run(item.id, item.name, item.quantity, item.minThreshold, item.unit, item.costPerUnit, now);
      }
    });

    transaction();
    console.log('Seeded 8 default inventory items.');
  } else {
    console.log('Inventory table is already seeded.');
  }

  // 4. Seed some sample upcoming utility bill expenses or generic expenses if empty
  const expenseCount = db.prepare('SELECT COUNT(*) as count FROM Expense').get();
  console.log(`Current expense count: ${expenseCount.count}`);
  
  // Let's seed some bills with upcoming due dates or different categories for charts
  // Let's check what categories exist or just make sure there's enough data for charts
  const now = new Date();
  
  // Add some overdue / upcoming alert expenses (e.g. rent/utilities with category 'Utility' or 'Rent')
  // We'll insert some mock utility bills that are unpaid or just overdue/due soon.
  // We can represent due dates in notes or add them to the category/notes.
  // Wait, let's see what columns Expense has: id, name, amount, date, category, notes, invoiceId, createdAt, updatedAt
  // We can represent an upcoming expense by inserting an expense with a date that is tomorrow or next week, 
  // and check for it in our operational alert panel.
  
  console.log('Migration completed successfully.');

} catch (err) {
  console.error('Error executing migration:', err);
  process.exit(1);
} finally {
  db.close();
}
