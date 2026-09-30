import React, { useState } from 'react';
import { Printer, CheckCircle, Receipt, X, ShieldCheck } from 'lucide-react';

export default function BilingualLabelModal({ dispenseData, onClose }) {
  const [activeTab, setActiveTab] = useState('label'); // 'label' or 'receipt'

  if (!dispenseData) return null;

  const labels = dispenseData.bilingualLabels || [];
  const receipt = dispenseData.receipt;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="card max-w-2xl w-full p-6 bg-white shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Printer className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-slate-900 tracking-tight">
                ES 7084:2024 Auxiliary Packaging & POS Receipt
              </h2>
              <p className="text-xs text-slate-500">
                Ethiopian Standard Bilingual Labeling (Amharic & English) • Stock Decremented
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
        </div>

        {/* Tab Switcher: Sticker Label vs POS Receipt */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('label')}
            className={`pb-2 px-4 text-xs font-bold border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'label'
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Adhesive Bilingual Label ({labels.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('receipt')}
            className={`pb-2 px-4 text-xs font-bold border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'receipt'
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Official POS Sales Receipt</span>
          </button>
        </div>

        {/* TAB 1: BILINGUAL ADHESIVE STICKER LABELS (ES 7084:2024 / FR10 / UQR4) */}
        {activeTab === 'label' && (
          <div className="space-y-4">
            <div id="printable-label" className="space-y-4">
              {labels.map((lbl, idx) => (
                <div
                  key={idx}
                  className="border-2 border-slate-800 rounded-lg p-4 bg-amber-50/20 text-slate-900 space-y-3 font-sans shadow-sm"
                >
                  {/* Pharmacy Header */}
                  <div className="border-b border-slate-800 pb-2 text-center">
                    <h3 className="font-extrabold text-sm tracking-wide text-slate-900 ethiopic-font">
                      {lbl.facility.name}
                    </h3>
                    <p className="text-[11px] text-slate-600">
                      {lbl.facility.branch} • Tel: {lbl.facility.phone}
                    </p>
                    <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest block mt-0.5">
                      {lbl.standard} • Lic: {lbl.facility.license}
                    </span>
                  </div>

                  {/* Patient & Medication Row */}
                  <div className="grid grid-cols-2 gap-2 text-xs border-b border-slate-200 pb-2">
                    <div>
                      <span className="text-slate-500 text-[10px] block">Patient Name (የታካሚ ስም):</span>
                      <strong className="text-slate-900 font-bold">{lbl.patient.fullName}</strong>
                      <span className="text-slate-500 text-[10px] block">ID: {lbl.patient.patientId} • Age: {lbl.patient.age}y</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-500 text-[10px] block">Dispensed Medicine (መድኃኒት):</span>
                      <strong className="text-slate-900 font-bold text-sm">{lbl.medication.genericName}</strong>
                      <span className="text-slate-700 text-xs block">
                        {lbl.medication.strength} {lbl.medication.dosageForm} ({lbl.medication.brandName})
                      </span>
                    </div>
                  </div>

                  {/* Bilingual Usage Instructions */}
                  <div className="p-2.5 bg-slate-100 rounded border border-slate-300 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Dosage Instructions / የአወሳሰድ መመሪያ:
                    </span>
                    {/* Amharic Text */}
                    <p className="ethiopic-font text-xs font-bold text-slate-900 leading-snug">
                      {lbl.instructions.amharic}
                    </p>
                    {/* English Text */}
                    <p className="text-[11px] text-slate-700 italic">
                      {lbl.instructions.english}
                    </p>
                  </div>

                  {/* Cautions & Storage */}
                  <div className="text-[10px] text-slate-600 space-y-0.5">
                    <p className="ethiopic-font font-medium">
                      ⚠️ <strong>ማሳሰቢያ:</strong> {lbl.cautions.amharic}
                    </p>
                    <p className="italic">
                      ⚠️ <strong>Caution:</strong> {lbl.cautions.english}
                    </p>
                  </div>

                  {/* Footer & Barcode */}
                  <div className="pt-2 border-t border-slate-300 flex items-center justify-between text-[10px] text-slate-500">
                    <div>
                      <span>Batch: <strong>{lbl.medication.batchNumber}</strong></span>
                      <span className="ml-2">Exp: <strong>{lbl.medication.expiryDate}</strong></span>
                    </div>
                    <div>
                      <span>Dispenser: <strong>{lbl.dispenserInfo.dispensedBy}</strong></span>
                      <span className="ml-2">Date: {lbl.dispenserInfo.dispenseDate}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-500 text-center">
              Adhesive packaging label formatted for 100mm x 75mm thermal sticker roll compliant with ES 7084:2024.
            </p>
          </div>
        )}

        {/* TAB 2: POS SALES RECEIPT (Section 4.3.5 / 4.7) */}
        {activeTab === 'receipt' && receipt && (
          <div className="max-w-sm mx-auto p-4 border border-slate-300 rounded-lg bg-slate-50 font-mono text-xs space-y-3 shadow-inner">
            <div className="text-center border-b border-dashed border-slate-400 pb-2">
              <h4 className="font-bold text-sm uppercase">{receipt.pharmacyName}</h4>
              <p className="text-[10px] text-slate-500">Bethel Ring Road, Addis Ababa, Ethiopia</p>
              <p className="text-[10px] text-slate-500">{receipt.taxIdentificationNumber}</p>
              <p className="text-[11px] font-bold mt-1">OFFICIAL CASH SALES RECEIPT</p>
            </div>

            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Receipt No:</span>
                <strong>{receipt.receiptNumber}</strong>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{new Date(receipt.date).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Patient:</span>
                <span>{receipt.patientName}</span>
              </div>
              <div className="flex justify-between">
                <span>Prescriber:</span>
                <span>{receipt.prescriber}</span>
              </div>
            </div>

            <div className="border-t border-b border-dashed border-slate-400 py-2 space-y-1">
              {receipt.items.map((it, idx) => (
                <div key={idx} className="flex justify-between text-[11px]">
                  <span>{it.quantity}x {it.name} {it.strength}</span>
                  <span>Batch: {it.batchNumber}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between text-sm font-bold pt-1">
              <span>TOTAL (ETB):</span>
              <span>{receipt.totalPriceETB.toFixed(2)} Birr</span>
            </div>

            <div className="text-center pt-2 border-t border-dashed border-slate-400 text-[10px] text-slate-500">
              <p>Cashier / Dispenser: {receipt.dispensedBy}</p>
              <p>Thank you for choosing Tewedaj Pharmacy!</p>
              <p>ኢትዮጵያ ጤና ጥበቃ ፈቃድ ያለው</p>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-100"
          >
            Done
          </button>

          <button
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-lg bg-sky-600 text-white font-bold text-xs hover:bg-sky-700 shadow-md flex items-center space-x-2 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Label (Thermal 300 DPI)</span>
          </button>
        </div>

      </div>
    </div>
  );
}
