import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'dev.db');
const db = new Database(dbPath);

// Make sure SQLite features like JSON are supported (better-sqlite3 handles it automatically)
// Define Types for Database Entities

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: 'DENTIST' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
}

export interface Patient {
  id: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  contactNumber: string;
  email: string | null;
  emergencyContact: string;
  medicalHistory: string; // JSON string representing allergies, chronicConditions, notes
  createdAt: string;
  updatedAt: string;
}

export interface Treatment {
  id: string;
  name: string;
  category: string;
  cost: number;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  patientId: string;
  status: 'PENDING' | 'PAID';
  issueDate: string;
  dueDate: string;
  taxRate: number;
  discount: number;
  subtotal: number;
  total: number;
  paidAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  treatmentId: string;
  quantity: number;
  cost: number;
}

export interface Appointment {
  id: string;
  patientId: string;
  dentistId: string;
  dateTime: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  name: string;
  amount: number;
  date: string;
  category: string;
  notes: string | null;
  invoiceId: string | null; // Linked patient invoice
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  minThreshold: number;
  unit: string;
  costPerUnit: number;
  updatedAt: string;
}



// Database helper functions
export const query = {
  // Users
  getUserByEmail: (email: string): User | undefined => {
    return db.prepare('SELECT * FROM User WHERE email = ?').get(email) as User | undefined;
  },
  getUserById: (id: string): User | undefined => {
    return db.prepare('SELECT * FROM User WHERE id = ?').get(id) as User | undefined;
  },
  getUsers: (): User[] => {
    return db.prepare('SELECT * FROM User').all() as User[];
  },
  createUser: (user: Omit<User, 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    return db.prepare(
      'INSERT INTO User (id, email, name, passwordHash, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(user.id, user.email, user.name, user.passwordHash, user.role, now, now);
  },

  // Patients
  getPatients: (): Patient[] => {
    return db.prepare('SELECT * FROM Patient ORDER BY fullName ASC').all() as Patient[];
  },
  getPatientById: (id: string): Patient | undefined => {
    return db.prepare('SELECT * FROM Patient WHERE id = ?').get(id) as Patient | undefined;
  },
  createPatient: (patient: Omit<Patient, 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    return db.prepare(
      'INSERT INTO Patient (id, fullName, dateOfBirth, gender, contactNumber, email, emergencyContact, medicalHistory, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(
      patient.id,
      patient.fullName,
      patient.dateOfBirth,
      patient.gender,
      patient.contactNumber,
      patient.email,
      patient.emergencyContact,
      patient.medicalHistory,
      now,
      now
    );
  },
  updatePatient: (id: string, patient: Partial<Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>>) => {
    const now = new Date().toISOString();
    const fields = Object.keys(patient);
    if (fields.length === 0) return;
    
    const setClause = fields.map(field => `"${field}" = ?`).join(', ');
    const values = fields.map(field => (patient as any)[field]);
    values.push(now, id);
    
    return db.prepare(
      `UPDATE Patient SET ${setClause}, updatedAt = ? WHERE id = ?`
    ).run(...values);
  },
  deletePatient: (id: string) => {
    return db.prepare('DELETE FROM Patient WHERE id = ?').run(id);
  },

  // Treatments
  getTreatments: (): Treatment[] => {
    return db.prepare('SELECT * FROM Treatment ORDER BY name ASC').all() as Treatment[];
  },
  getTreatmentById: (id: string): Treatment | undefined => {
    return db.prepare('SELECT * FROM Treatment WHERE id = ?').get(id) as Treatment | undefined;
  },
  createTreatment: (treatment: Omit<Treatment, 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    return db.prepare(
      'INSERT INTO Treatment (id, name, category, cost, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(treatment.id, treatment.name, treatment.category, treatment.cost, now, now);
  },
  updateTreatment: (id: string, cost: number) => {
    const now = new Date().toISOString();
    return db.prepare(
      'UPDATE Treatment SET cost = ?, updatedAt = ? WHERE id = ?'
    ).run(cost, now, id);
  },

  // Invoices
  getInvoices: (): (Invoice & { patientName: string })[] => {
    return db.prepare(`
      SELECT i.*, p.fullName as patientName 
      FROM Invoice i
      JOIN Patient p ON i.patientId = p.id
      ORDER BY i.createdAt DESC
    `).all() as (Invoice & { patientName: string })[];
  },
  getInvoiceById: (id: string): (Invoice & { patientName: string; patientEmail: string | null; patientPhone: string }) | undefined => {
    return db.prepare(`
      SELECT i.*, p.fullName as patientName, p.email as patientEmail, p.contactNumber as patientPhone
      FROM Invoice i
      JOIN Patient p ON i.patientId = p.id
      WHERE i.id = ?
    `).get(id) as (Invoice & { patientName: string; patientEmail: string | null; patientPhone: string }) | undefined;
  },
  getInvoiceItems: (invoiceId: string): (InvoiceItem & { treatmentName: string })[] => {
    return db.prepare(`
      SELECT ii.*, t.name as treatmentName
      FROM InvoiceItem ii
      JOIN Treatment t ON ii.treatmentId = t.id
      WHERE ii.invoiceId = ?
    `).all() as (InvoiceItem & { treatmentName: string })[];
  },
  createInvoice: (
    invoice: Omit<Invoice, 'createdAt' | 'updatedAt'>,
    items: Omit<InvoiceItem, 'invoiceId'>[]
  ) => {
    const now = new Date().toISOString();
    
    // Run as a transaction
    const transaction = db.transaction(() => {
      // 1. Insert Invoice
      db.prepare(`
        INSERT INTO Invoice (id, patientId, status, issueDate, dueDate, taxRate, discount, subtotal, total, paidAmount, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        invoice.id,
        invoice.patientId,
        invoice.status,
        invoice.issueDate,
        invoice.dueDate,
        invoice.taxRate,
        invoice.discount,
        invoice.subtotal,
        invoice.total,
        invoice.paidAmount,
        now,
        now
      );

      // 2. Insert Invoice Items
      const insertItem = db.prepare(`
        INSERT INTO InvoiceItem (id, invoiceId, treatmentId, quantity, cost)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      for (const item of items) {
        insertItem.run(item.id, invoice.id, item.treatmentId, item.quantity, item.cost);
      }
    });

    return transaction();
  },
  updateInvoiceStatus: (id: string, status: 'PENDING' | 'PAID', paidAmount: number) => {
    const now = new Date().toISOString();
    return db.prepare(
      'UPDATE Invoice SET status = ?, paidAmount = ?, updatedAt = ? WHERE id = ?'
    ).run(status, paidAmount, now, id);
  },
  deleteInvoice: (id: string) => {
    const transaction = db.transaction(() => {
      db.prepare('DELETE FROM InvoiceItem WHERE invoiceId = ?').run(id);
      db.prepare('DELETE FROM Invoice WHERE id = ?').run(id);
    });
    return transaction();
  },

  // Appointments
  getAppointments: (): (Appointment & { patientName: string; dentistName: string })[] => {
    return db.prepare(`
      SELECT a.*, p.fullName as patientName, u.name as dentistName
      FROM Appointment a
      JOIN Patient p ON a.patientId = p.id
      JOIN User u ON a.dentistId = u.id
      ORDER BY a.dateTime ASC
    `).all() as (Appointment & { patientName: string; dentistName: string })[];
  },
  createAppointment: (appointment: Omit<Appointment, 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    return db.prepare(`
      INSERT INTO Appointment (id, patientId, dentistId, dateTime, status, notes, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      appointment.id,
      appointment.patientId,
      appointment.dentistId,
      appointment.dateTime,
      appointment.status,
      appointment.notes,
      now,
      now
    );
  },
  updateAppointmentStatus: (id: string, status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED') => {
    const now = new Date().toISOString();
    return db.prepare('UPDATE Appointment SET status = ?, updatedAt = ? WHERE id = ?').run(status, now, id);
  },
  deleteAppointment: (id: string) => {
    return db.prepare('DELETE FROM Appointment WHERE id = ?').run(id);
  },

  // Expenses
  getExpenses: (): Expense[] => {
    return db.prepare('SELECT * FROM Expense ORDER BY date DESC, name ASC').all() as Expense[];
  },
  getExpenseById: (id: string): Expense | undefined => {
    return db.prepare('SELECT * FROM Expense WHERE id = ?').get(id) as Expense | undefined;
  },
  getExpensesByInvoiceId: (invoiceId: string): Expense[] => {
    return db.prepare('SELECT * FROM Expense WHERE invoiceId = ? ORDER BY date DESC').all(invoiceId) as Expense[];
  },
  createExpense: (expense: Omit<Expense, 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    return db.prepare(
      'INSERT INTO Expense (id, name, amount, date, category, notes, invoiceId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(expense.id, expense.name, expense.amount, expense.date, expense.category, expense.notes, expense.invoiceId || null, now, now);
  },
  updateExpense: (id: string, expense: Partial<Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>>) => {
    const now = new Date().toISOString();
    const fields = Object.keys(expense);
    if (fields.length === 0) return;
    
    const setClause = fields.map(field => `"${field}" = ?`).join(', ');
    const values = fields.map(field => (expense as any)[field]);
    values.push(now, id);
    
    return db.prepare(
      `UPDATE Expense SET ${setClause}, updatedAt = ? WHERE id = ?`
    ).run(...values);
  },
  deleteExpense: (id: string) => {
    return db.prepare('DELETE FROM Expense WHERE id = ?').run(id);
  },

  // Inventory
  getInventory: (): InventoryItem[] => {
    return db.prepare('SELECT * FROM Inventory ORDER BY name ASC').all() as InventoryItem[];
  },
  getInventoryItemById: (id: string): InventoryItem | undefined => {
    return db.prepare('SELECT * FROM Inventory WHERE id = ?').get(id) as InventoryItem | undefined;
  },
  createInventoryItem: (item: Omit<InventoryItem, 'updatedAt'>) => {
    const now = new Date().toISOString();
    return db.prepare(
      'INSERT INTO Inventory (id, name, quantity, minThreshold, unit, costPerUnit, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(item.id, item.name, item.quantity, item.minThreshold, item.unit, item.costPerUnit, now);
  },
  updateInventoryItem: (id: string, item: Partial<Omit<InventoryItem, 'id' | 'updatedAt'>>) => {
    const now = new Date().toISOString();
    const fields = Object.keys(item);
    if (fields.length === 0) return;
    
    const setClause = fields.map(field => `"${field}" = ?`).join(', ');
    const values = fields.map(field => (item as any)[field]);
    values.push(now, id);
    
    return db.prepare(
      `UPDATE Inventory SET ${setClause}, updatedAt = ? WHERE id = ?`
    ).run(...values);
  },
  deleteInventoryItem: (id: string) => {
    return db.prepare('DELETE FROM Inventory WHERE id = ?').run(id);
  }
};

export default db;
