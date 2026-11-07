# DentoCare - Dentist Management System

A full-featured clinic management application built with **Next.js**, **React**, **Tailwind CSS**, and **SQLite** (`better-sqlite3`).

---

## Features

- **Dashboard & Analytics**: Real-time cash flow analysis, expense breakdown charts, and active clinic operational alerts.
- **Patient Management**: Patient registration, medical history tracking, contact records, and patient intake forms.
- **Appointments**: Interactive calendar and appointment scheduling with status management.
- **Billing & Invoices**: Itemized invoice generator, tax calculations, discounts, and print/PDF-ready invoice views.
- **Inventory Control**: Material and supplies tracking with low-stock alerts.
- **Expense Ledger**: Operational expense tracking categorized by utilities, rent, supplies, and linked invoice payouts.

---

## Prerequisites

Before running the application, make sure you have **Node.js LTS (v20 or v22)** installed on your computer:

- **Download Node.js**: [https://nodejs.org](https://nodejs.org) *(Choose the LTS version)*

---

## Download & Setup

Open your terminal or command prompt and clone the repository:

```bash
git clone https://github.com/sheynahmed/dentist-management-system.git
cd dentist-management-system
```

Alternatively, click the green **Code** button on GitHub and choose **Download ZIP**, then extract the folder.

---

## Instructions for Windows

### Quick Launcher (One-Click)
1. Open the project folder in File Explorer.
2. Double-click **`run-clinic-app.bat`**.
3. The server will start in a minimized window and automatically open your default browser to:
   ```
   http://localhost:3000
   ```
4. To stop the server when you are done, return to the launcher window and press any key.

### Desktop Shortcut (Optional)
To open the clinic app directly from your Windows Desktop:
1. Right-click **`run-clinic-app.bat`**.
2. Select **Show more options** &rarr; **Send to** &rarr; **Desktop (create shortcut)**.
3. Rename the shortcut to **DentoCare Clinic App**.

### Manual Command Line Run
If you prefer using PowerShell or Command Prompt:
```powershell
npm install
node migrate.js
npm run dev
```

---

## Instructions for macOS

### Quick Launcher (One-Click)
1. Open the project folder in Finder.
2. If this is your first time opening the launcher, grant execution permission in Terminal:
   - Open the **Terminal** app.
   - Run the following command (replace with your file path or drag and drop the file into Terminal):
     ```bash
     chmod +x "Launch Clinic App.command"
     ```
3. If macOS displays a warning saying the file is from an *unidentified developer* or *damaged* (Gatekeeper security):
   - Run this command in Terminal to remove the quarantine flag:
     ```bash
     xattr -cr "Launch Clinic App.command"
     ```
4. Now simply **double-click `Launch Clinic App.command`** in Finder. It will install packages on the first run, launch the server, and open your browser to `http://localhost:3000`.

### Manual Command Line Run
Open Terminal, navigate to the folder, and run:
```bash
npm install
node migrate.js
npm run dev
```
Open your browser and navigate to **`http://localhost:3000`**.

---

## Database

The application uses an embedded SQLite database stored locally in `dev.db`.
- Database schema and initial seeds are configured automatically via `migrate.js`.
- All patient records, appointments, inventory items, and billing data persist locally in `dev.db`.

---

## License

This project is proprietary and intended for clinic management operations.
