# RxGuard - Full-Stack MERN Prescription Dispensing & Clinical Verification System

**Compliant with Ethiopian Pharmacy Standard ES 7084:2024 & Ethiopian Food and Drug Authority (EFDA) Good Dispensing Practice**  
*Implementation based on HiLCoE School of Computer Science and Technology SE332 Requirements Specification Document (Group 2: Alae Bakil et al.)*

---

## 🌟 Executive Overview

**RxGuard** is an intelligent clinical verification and pharmacy dispensing web application engineered to eliminate analog, error-prone dispensing workflows observed in Ethiopian retail pharmacies (such as *Tewedaj Pharmacy* in Bethel, Addis Ababa).

### Core Features Implemented:
- **PC-1 & UC01 (Dual-Pane Intake & Capture):** Split-screen desktop interface. Left pane for digitized prescription capture, patient demographic profiling (mandatory child weight for ages < 12 per **DEF-05**), and doctor licensing format verification (`ETH-MD-XXXXX`). Prescription validity checks (Acute $\le 15$ days, Chronic $\le 30$ days pursuant to **ES 7084:2024**).
- **PC-2 & UC02 (Real-Time AI Clinical Verification Engine):** Sub-1.5 second latency screening (**PQR1**) evaluating:
  - Drug-Drug Interactions (DDI) categorized into Mild, Moderate, and Critical tiers with pharmacological mechanism and evidence citations.
  - Allergy contraindications (e.g., Penicillin allergy vs. Amoxicillin).
  - Disease state contraindications (e.g., Warfarin / Aspirin contraindicated with Active Peptic Ulcers).
  - Dynamic risk score computation ($0.00$ to $1.00$).
- **PC-3 & US-CP-03 (Pediatric & Geriatric Dosage Guard):** Algorithmic weight/age-based dosage checking against EFDA formulary upper limits.
- **PC-4, FR07 & FR08 (Perpetual Inventory & FEFO Allocation):** Automated lot reservation according to *First-Expiry-First-Out (FEFO)*. Blocks automated reservation of batches expiring within 30 days unless supervisory emergency release is granted (**DEF-01**).
- **PC-5, UC03 & DEF-02 (Structured Clinical Override & Immutable Audit Trail):** Two-factor override requiring standard justification codes, clinical rationale ($\ge 15$ characters), credential PIN (`1234`), and digital signature hash linked 1-to-1 to the safety alert (**DEF-02**).
- **UC05, FR09 & US-PT-01 (Optical Barcode Verification & Handover):** 1D UPC and 2D GS1 DataMatrix scanning ($<300$ms **PQR2**). Displays full-screen red warning modal and plays audio alert on strength or batch mismatches (e.g., scanning Metformin 850mg when 500mg was prescribed).
- **FR10 & UQR4 (Bilingual Auxiliary Label Printing):** Generates thermal adhesive packaging labels in **Amharic (አማርኛ)** and **English** formatted to **ES 7084:2024**, complete with storage precautions and official POS sales cash receipts.
- **UC06 & US-PA-02 (EFDA Regulatory Sync):** Zero-downtime synchronization of national drug formularies, scheduled medicines, and banned substances.
- **Section 4.7 External Interface (HL7 FHIR Interoperability):** End-to-end ingestion of EHR prescriptions via `POST /fhir/R4/MedicationRequest`.
- **SQR1, SQR2, SQR6 & UQR2 (Security & Accessibility):** Bcrypt work factor 12 password salting, 10-minute terminal session auto-lock, 5-attempt account lockout, and WCAG 2.1 AA High Contrast Mode toggle ($4.5:1$ ratio).

---

## 🚀 Quick Start Options

You can run RxGuard either using **Docker Compose**, testing via **Postman**, or running directly with **Node.js** (zero-config in-memory database included).

### Option 1: Run with Docker Compose

Ensure Docker Desktop is open and run:

```bash
docker compose up --build
```

- **Client Web UI:** `http://localhost:3000`
- **Server API:** `http://localhost:5000`
- **MongoDB:** `localhost:27017`

---

### Option 2: Run Directly with Node.js (Zero Setup Mode)

The backend includes a zero-configuration in-memory database fallback. If local MongoDB or Docker is not running, it initializes an embedded in-memory database automatically with all pre-loaded test data!

```bash
# 1. Start backend server (from project root)
npm start

# The app is now live at: http://localhost:5000
```

To run both client and server in hot-reload development mode:
```bash
# Terminal 1: Backend
npm run server

# Terminal 2: Frontend (Vite)
npm run client
# Vite UI will open at: http://localhost:3000
```

---

### Option 3: Test with Postman

1. Open **Postman**.
2. Click **Import** and select:
   - `RxGuard_API.postman_collection.json`
   - `RxGuard_Environment.postman_environment.json`
3. Select the **"RxGuard Local & Docker Environment"** environment in the top right.
4. Execute the requests across the 9 folders. Automated test assertions verify status codes, token extraction, PQR1 latency benchmarks ($<1.5$s), and validation rules.

---

## 🧪 Built-In SRS Demonstration Scenarios

In the web app header, click any of the **"Load Test Scenario"** buttons to immediately test the exact requirements from the specification document:

| Scenario | Case Description | Expected Result |
| :--- | :--- | :--- |
| **1. Nominal Clean** | Amoxicillin 500mg TID for 28yo Yared Tadesse. | Risk score `0.02` (Clean/Green). Passes directly to dispensing within 0.8s. |
| **2. Critical DDI** | Warfarin 5mg + Aspirin 100mg for Almaz Bekele with active ulcer history. | Level 1 Critical Flag (Red). Risk score `0.94`. Dispensing frozen; routes to clinical review. |
| **3. Moderate Override** | Atorvastatin 40mg + Diltiazem 120mg for Birtukan Desta. | Moderate Statin flag (Amber, score `0.55`). Pharmacist enters rationale ($\ge 15$ chars) + PIN `1234` to override (**UC03 / DEF-02**). |
| **4. Pediatric Anomaly** | Amoxicillin 1500mg/day for 5yo child Kirubel (18kg). | Pediatric Dosage Guard flags daily dose exceeding the EFDA limit of 40mg/kg/day (**US-CP-03 / DEF-05**). |
| **5. Barcode Mismatch** | Metformin 500mg order; scan Metformin 850mg barcode. | Flashes red blocking modal and emits audio tone: *"Critical Error: Dosage Form/Strength Mismatch"*, freezing printing (**UC05 Scenario 2**). |
| **6. 30-Day Expiry Block** | Batch `LOT-AMX-NEAR-EXPIRY` with 15 days remaining shelf-life. | Automated reservation blocked per **FR08**. Requires supervisory release override (**DEF-01**). |
| **7. Bilingual Labels** | Finalize dispensing on verified order. | Formats adhesive thermal sticker in Amharic & English per **ES 7084:2024** and prints POS receipt. |
| **8. EFDA Formulary Sync** | Click "Trigger EFDA Formulary Sync" in Formulary tab. | Updates drug catalog and contraindications without system downtime (**UC06 / US-PA-02**). |

---

## 🔑 Default Test Accounts & Credentials

| Role | Username | Password | Credential PIN | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Senior Pharmacist** | `sitra_pharmacist` | `password123` | `1234` | Head Pharmacist from INT-01. Can override clinical alerts and sign audit logs. |
| **Pharmacy Technician** | `abebe_tech` | `password123` | — | Cashier/Technician from INT-02. Handles barcode scanning and POS handover. |
| **Administrator** | `dawit_admin` | `password123` | `9999` | System Administrator. Formulary sync, supervisory release, and audit export. |

---

## 📂 Project Architecture

```
webII/
├── docker-compose.yml                     # Docker Compose (MongoDB, Express Server, React Client)
├── package.json                           # Root scripts
├── README.md                              # Complete system documentation
├── RxGuard_API.postman_collection.json    # Complete Postman Collection (9 folders, automated tests)
├── RxGuard_Environment.postman_environment.json # Postman Environment variables
├── server/
│   ├── Dockerfile                         # Node 20 production container
│   ├── package.json
│   └── src/
│       ├── server.js                      # Express app, static serving, FHIR endpoint
│       ├── config/
│       │   ├── db.js                      # MongoDB connection with zero-config in-memory fallback
│       │   └── memoryStore.js             # High-speed in-memory database engine
│       ├── models/                        # Mongoose models & memory proxies
│       │   ├── User.js, Patient.js, Drug.js, BatchInventory.js
│       │   ├── Prescription.js, SafetyAlert.js, OverrideLog.js, AuditLog.js
│       │   └── modelProxy.js              # Seamless MongoDB / memory switcher
│       ├── services/
│       │   ├── clinicalVerificationEngine.js # DDI, contraindications & pediatric formulas
│       │   ├── inventoryService.js        # FEFO allocation, expiry guard & barcode matching
│       │   ├── labelGeneratorService.js   # ES 7084:2024 bilingual Amharic/English generator
│       │   └── auditService.js            # Immutable append-only audit logger
│       ├── controllers/                   # REST controller implementations
│       ├── routes/                        # Express API route modules
│       ├── middleware/                    # Auth, RBAC & plain-language error handler (UQR6)
│       └── seed/                          # Comprehensive seed data matching SRS
└── client/
    ├── Dockerfile                         # Multi-stage Nginx production container
    ├── package.json
    ├── vite.config.js
    ├── index.html                         # Ethiopic typography & accessibility fonts
    └── src/
        ├── index.css                      # Tailwind, High-Contrast WCAG 2.1 AA mode & thermal label print
        ├── main.jsx, App.jsx
        ├── context/AuthContext.jsx        # RBAC role switching, session lock & PHI masking
        ├── services/api.js                # Centralized API client
        └── components/
            ├── Navbar.jsx                 # System navigation, role switcher, contrast & lock toggles
            ├── IntakeSplitScreen.jsx      # UC01 & UC02 dual-pane desktop intake & live AI screening
            ├── OverrideModal.jsx          # UC03 structured override modal (15+ chars notes, PIN)
            ├── DispensingBarcodeModal.jsx # UC05 optical barcode scan simulator & mismatch alarm
            ├── BilingualLabelModal.jsx    # ES 7084:2024 Amharic/English label & POS receipt preview
            ├── InventoryView.jsx          # FR07 / FR08 FEFO perpetual inventory register
            ├── FormularySyncView.jsx      # UC06 EFDA regulatory sync & sub-500ms monograph search
            ├── AuditReportsView.jsx       # US-PA-01 / FR14 override audit exports & narcotics register
            └── WorkstationLockModal.jsx   # SQR2 front-counter terminal security lock
```
