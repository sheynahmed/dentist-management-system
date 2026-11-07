# DentoCare - Dentist Management System

A comprehensive, commercial-grade dental clinic management platform built with **Next.js**, **React**, **Tailwind CSS**, and **SQLite** (`better-sqlite3`).

Designed for dental practices, specialists, and multi-chair clinics to manage clinical treatments, patient odontograms, digital prescriptions, billing, appointments, and inventory—with zero cloud lock-in.

---

## 🚀 Key Features

### 1. 💊 Digital Dental Prescription (Rx) Generator
- **Quick Dental Presets**: 1-click addition of standard dental drug regimens:
  - *Augmentin 625mg* (1-0-1 for 5 days after meals)
  - *Amoxicillin 500mg* (1-1-1 for 5 days after meals)
  - *Metronidazole 400mg* (1-0-1 for 5 days after meals)
  - *Ibuprofen 400mg* / *Aceclofenac + Paracetamol* (pain relief)
  - *Ketorolac Tromethamine 10mg DT* (acute dental pain SOS)
  - *Chlorhexidine 0.2% Rinse* (antiseptic oral mouthwash)
  - *Pantoprazole 40mg* (antacid cover)
- **Printable / PDF Rx Slips**: Official clinic letterhead layout with Rx symbol, patient details, dosage table, instructions, and doctor's signature line.
- **WhatsApp Prescription Sharing**: 1-click button to send the structured prescription directly to the patient's phone.

### 2. 📝 Clinical Visit Notes & Case Sheets
- Record chronological patient case progression per visit:
  - **Tooth Number & Quadrant** (e.g. *Tooth #46 Lower Right 1st Molar*).
  - **Chief Complaint** and **Clinical Examination Findings**.
  - **Procedure Completed** (presets for *RCT Phases 1-3*, *Extractions*, *Restorations*, *Scaling*, *Crown Preps*).
  - **Next Appointment Treatment Plan**.

### 3. 💬 WhatsApp Post-Op Care & Recovery Guidelines
- Pre-formatted clinical recovery templates sent via WhatsApp with 1 click:
  - **Post-Extraction (Tooth Removal)**: Gauze pressure, no spitting/straws, cold diet, warm salt water rinse.
  - **Post-Root Canal Treatment (RCT)**: Temporary filling care, soreness expectations, chew on opposite side.
  - **Post-Scaling & Polishing**: Sensitivity guidance, brushing care.
  - **Post-Teeth Whitening**: 48-hour "White Diet" rules (avoiding coffee, tea, turmeric, smoking).

### 4. 📊 Clinic Reports & Data Export Center (CSV / Excel)
- Instant 1-click CSV spreadsheet export for:
  - **Patients Master Directory**
  - **Billing & Invoices Ledger**
  - **Expense & Overhead Register**
  - **Inventory & Materials Stock**
  - **Prescriptions History**

### 5. 🔍 Global Quick Command Palette (`Ctrl + K`)
- Press **`Ctrl + K`** (or **`Cmd + K`** on Mac) from anywhere in the app to:
  - Instantly search patients by name or contact number.
  - Quick shortcuts: Write Prescription, Book Appointment, Log Clinical Note, New Invoice, Export CSV.

### 6. 🦷 Visual Tooth Charting (Odontogram) & Patient Profiles
- Interactive 32-tooth odontogram mapping healthy teeth, caries, root canal treatments, crowns, and extractions.
- Medical history tracking (allergies, chronic illnesses, emergency contacts, intake consent signatures).

### 7. 📅 Calendar Scheduler & WhatsApp Appointment Reminders
- Weekly interactive chair appointment planner with 1-click WhatsApp appointment reminders.

### 8. 💰 Billing, Invoices & Commissions
- Itemized invoicing with automatic tax & discount calculation. Print/PDF ready invoice slips.

### 9. 📦 Inventory Control & Alert Center
- Stock upkeep for latex gloves, composites, anesthetic cartridges, alginate, and needles with automatic low-stock notifications.

---

## 💻 Running as a Standalone Desktop Application

DentoCare is configured to run in **Native Desktop App Window Mode**—meaning **no browser address bar, no tabs, and no `localhost` URL displayed**:

### Windows (1-Click from Homescreen)
1. Double-click the **`DentoCare Clinic App`** shortcut on your Desktop (or double-click **`run-clinic-app.bat`** in the project folder).
2. The server initializes in the background and launches directly into a standalone desktop application window.
3. To shut down the app, press any key in the launcher console window.

### macOS (1-Click from Finder)
1. In the project folder on your Mac, double-click **`Launch Clinic App.command`**.
2. If opening for the first time, make it executable via Terminal:
   ```bash
   chmod +x "Launch Clinic App.command"
   ```
3. If macOS Gatekeeper shows a security warning:
   ```bash
   xattr -cr "Launch Clinic App.command"
   ```

---

## 🌐 Cloud Deployment (Zero Local Setup)

To access DentoCare from **any device** (smartphones, iPads, reception desk PC, home Mac) without ever running any local server:
1. Fork or push this repository to your GitHub account.
2. Sign in to **[vercel.com](https://vercel.com)**.
3. Click **"Add New Project"** & select `dentist-management-system`.
4. Click **Deploy**.
5. You'll receive a public clinic URL (e.g., `https://dentocare.vercel.app`) accessible securely from any browser.

---

## 🛠️ Manual Terminal Run

```bash
# 1. Install dependencies
npm install

# 2. Run database migration & table checks
node migrate.js

# 3. Start development server
npm run dev
```
Open **`http://localhost:3000`** in your browser.

---

## 🗄️ Database

All patient records, medical histories, invoices, appointments, and inventory balances are stored in an embedded SQLite database (`dev.db`). No external database server configuration required.

---

## 📄 License

This software is developed for DentoCare Dental Clinic operations. All rights reserved.
