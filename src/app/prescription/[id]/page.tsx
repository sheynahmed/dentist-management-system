'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Printer, ArrowLeft, Pill, Share2, Activity, ShieldCheck, MessageCircle } from 'lucide-react';

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface PrescriptionDetails {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string | null;
  patientGender: string;
  patientDob: string;
  dentistName: string;
  date: string;
  diagnosis: string;
  medications: string;
  advice: string | null;
  createdAt: string;
}

export default function PrescriptionSlipPage({ params }: { params: { id: string } }) {
  const [prescription, setPrescription] = useState<PrescriptionDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrescription();
  }, [params.id]);

  const fetchPrescription = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/prescriptions/${params.id}`);
      const data = await res.json();
      if (data.success) {
        setPrescription(data.prescription);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsApp = () => {
    if (!prescription) return;
    let medsList: Medication[] = [];
    try {
      medsList = JSON.parse(prescription.medications);
    } catch (e) {}

    const medsText = medsList.map((m, i) => `${i + 1}. *${m.name}* (${m.dosage})\n   - Frequency: ${m.frequency}\n   - Duration: ${m.duration} (${m.instructions})`).join('\n');

    const message = `*DentoCare Clinic - Dental Prescription (Rx)*\n\n` +
      `*Patient:* ${prescription.patientName}\n` +
      `*Doctor:* ${prescription.dentistName}\n` +
      `*Date:* ${prescription.date}\n` +
      `*Diagnosis:* ${prescription.diagnosis}\n\n` +
      `*Medications (Rx):*\n${medsText}\n\n` +
      `*Clinical Advice:*\n${prescription.advice || 'Follow medication schedule carefully.'}\n\n` +
      `_DentoCare Dental Clinic - Get well soon!_`;

    const cleanPhone = prescription.patientPhone ? prescription.patientPhone.replace(/\D/g, '') : '';
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <p className="text-slate-500 font-medium animate-pulse">Loading prescription slip...</p>
      </div>
    );
  }

  if (!prescription) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md">
          <p className="text-rose-600 font-bold mb-2">Prescription Not Found</p>
          <p className="text-sm text-slate-500 mb-4">The prescription record could not be loaded.</p>
          <Link href="/prescriptions" className="text-xs text-emerald-600 font-bold hover:underline">
            &larr; Return to Prescriptions List
          </Link>
        </div>
      </div>
    );
  }

  let meds: Medication[] = [];
  try {
    meds = JSON.parse(prescription.medications);
  } catch (e) {}

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      {/* Top Action Bar (hidden when printing) */}
      <div className="max-w-3xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <Link
          href="/prescriptions"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Prescriptions
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={handleWhatsApp}
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-semibold text-sm shadow-sm transition-all cursor-pointer"
          >
            <MessageCircle className="h-4 w-4" />
            Send on WhatsApp
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl font-semibold text-sm shadow-sm shadow-emerald-900/20 transition-all cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            Print / Save as PDF
          </button>
        </div>
      </div>

      {/* Official Prescription Slip Sheet */}
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg border border-slate-200 p-8 sm:p-12 print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-full print:rounded-none">
        
        {/* Clinic Header */}
        <div className="border-b-2 border-emerald-600 pb-6 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600 rounded-xl text-white">
              <Activity className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">DentoCare</h1>
              <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest">
                Dental Clinic & Implant Center
              </p>
            </div>
          </div>
          <div className="text-left sm:text-right text-xs text-slate-500 space-y-0.5">
            <p className="font-bold text-slate-800 text-sm">{prescription.dentistName}</p>
            <p>BDS, MDS - Dental & Maxillofacial Surgeon</p>
            <p>Reg. No: D-84920/2018</p>
            <p>Phone: +91 98765 43210 | clinic@dentocare.com</p>
          </div>
        </div>

        {/* Patient Details Bar */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 mb-8 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <p className="text-slate-400 font-medium uppercase tracking-wider text-[10px]">Patient Name</p>
            <p className="font-bold text-slate-800 text-sm mt-0.5">{prescription.patientName}</p>
          </div>
          <div>
            <p className="text-slate-400 font-medium uppercase tracking-wider text-[10px]">Gender / Age</p>
            <p className="font-semibold text-slate-700 mt-0.5">
              {prescription.patientGender} {prescription.patientDob ? `• DOB: ${prescription.patientDob}` : ''}
            </p>
          </div>
          <div>
            <p className="text-slate-400 font-medium uppercase tracking-wider text-[10px]">Phone Number</p>
            <p className="font-semibold text-slate-700 mt-0.5">{prescription.patientPhone}</p>
          </div>
          <div>
            <p className="text-slate-400 font-medium uppercase tracking-wider text-[10px]">Date & Rx ID</p>
            <p className="font-bold text-slate-900 mt-0.5">
              {prescription.date} <span className="text-[10px] text-slate-400">({prescription.id})</span>
            </p>
          </div>
        </div>

        {/* Clinical Diagnosis Section */}
        <div className="mb-6 flex items-baseline gap-3 pb-3 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Diagnosis:</span>
          <span className="text-sm font-extrabold text-slate-800">{prescription.diagnosis}</span>
        </div>

        {/* Prescribed Medications (Rx) Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-3xl font-serif font-black text-emerald-800 italic">℞</span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Medical Prescription</span>
          </div>

          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Medicine & Strength</th>
                <th className="py-2.5 px-3">Frequency</th>
                <th className="py-2.5 px-3">Duration</th>
                <th className="py-2.5 px-3">Instructions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {meds.map((med, index) => (
                <tr key={index} className="hover:bg-slate-50/50">
                  <td className="py-3 px-3 font-semibold text-slate-400">{index + 1}</td>
                  <td className="py-3 px-3">
                    <p className="font-bold text-slate-900 text-sm">{med.name}</p>
                    {med.dosage && <p className="text-[11px] text-slate-400">{med.dosage}</p>}
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-700">{med.frequency}</td>
                  <td className="py-3 px-3 font-medium text-slate-600">{med.duration}</td>
                  <td className="py-3 px-3 text-slate-600 font-medium">{med.instructions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Clinical Advice & Instructions */}
        {prescription.advice && (
          <div className="mb-12 bg-emerald-50/40 p-4 rounded-xl border border-emerald-100">
            <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              General Instructions & Care:
            </h4>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              {prescription.advice}
            </p>
          </div>
        )}

        {/* Signatures & Footer */}
        <div className="pt-10 border-t border-slate-200 flex justify-between items-end text-xs">
          <div>
            <p className="text-[10px] text-slate-400">Clinic Working Hours: 9:00 AM - 8:30 PM</p>
            <p className="text-[10px] text-slate-400">Valid for 30 days from date of issue.</p>
          </div>
          <div className="text-center w-52">
            <div className="h-16 flex items-end justify-center mb-1">
              <span className="font-serif italic text-slate-400 text-sm">Signed electronically</span>
            </div>
            <div className="border-t border-slate-400 pt-1.5">
              <p className="font-bold text-slate-800 text-xs">{prescription.dentistName}</p>
              <p className="text-[10px] text-slate-500">Doctor&apos;s Signature & Stamp</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
