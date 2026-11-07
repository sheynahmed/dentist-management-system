'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  User, 
  FileText, 
  ShieldAlert, 
  PenTool, 
  CheckCircle, 
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Clock
} from 'lucide-react';
import Link from 'next/link';

const CHRONIC_CONDITIONS = [
  'Hypertension',
  'Diabetes',
  'Heart Disease',
  'Asthma / Respiratory',
  'Bleeding Disorders',
  'Allergy to Anesthetics',
  'Hepatitis / Liver Disease',
  'None'
];

export default function IntakePage() {
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('MALE');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');

  // Medical questionnaire
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [allergyInput, setAllergyInput] = useState('');
  const [allergiesList, setAllergiesList] = useState<string[]>([]);
  const [medicalNotes, setMedicalNotes] = useState('');

  // Consent & Signature
  const [consentChecked, setConsentChecked] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  
  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Initialize canvas events when on step 3
  useEffect(() => {
    if (step === 3 && canvasRef.current) {
      const canvas = canvasRef.current;
      // Handle high DPI displays
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
      }
    }
  }, [step]);

  // Drawing handlers for signature
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const handleStartDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const handleDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handleStopDraw = () => {
    if (isDrawing && canvasRef.current) {
      setIsDrawing(false);
      setSignatureData(canvasRef.current.toDataURL());
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureData(null);
  };

  const toggleCondition = (cond: string) => {
    if (cond === 'None') {
      setSelectedConditions(['None']);
      return;
    }

    let updated = selectedConditions.filter(c => c !== 'None');
    if (updated.includes(cond)) {
      updated = updated.filter(c => c !== cond);
    } else {
      updated.push(cond);
    }
    setSelectedConditions(updated);
  };

  const addAllergy = () => {
    if (allergyInput.trim() && !allergiesList.includes(allergyInput.trim())) {
      setAllergiesList([...allergiesList, allergyInput.trim()]);
      setAllergyInput('');
    }
  };

  const removeAllergy = (idx: number) => {
    setAllergiesList(allergiesList.filter((_, i) => i !== idx));
  };

  const handleNextStep = () => {
    setErrorMsg('');
    if (step === 1) {
      if (!fullName || !dateOfBirth || !contactNumber || !emergencyContact) {
        setErrorMsg('Please complete all required fields (*)');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handlePrevStep = () => {
    setErrorMsg('');
    setStep(prev => Math.max(1, prev - 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentChecked) {
      setErrorMsg('You must check the consent statement to register.');
      return;
    }
    if (!signatureData) {
      setErrorMsg('Please sign on the canvas to complete your check-in.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');

      const medicalHistoryPayload = {
        allergies: allergiesList,
        chronicConditions: selectedConditions.filter(c => c !== 'None'),
        notes: medicalNotes,
        signature: signatureData,
        consentDate: new Date().toISOString(),
        intakeForm: {
          submittedAt: new Date().toISOString(),
          emergencyContact
        }
      };

      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          dateOfBirth: new Date(dateOfBirth).toISOString(),
          gender,
          contactNumber,
          email: email || null,
          emergencyContact,
          medicalHistory: medicalHistoryPayload
        })
      });

      const data = await res.json();
      if (data.success) {
        setSubmittedId(data.patient.id);
      } else {
        setErrorMsg(data.message || 'Failed to submit intake. Please consult the desk.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Network error, failed to submit form.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center space-y-6 animate-scale-up">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600 border border-emerald-100 shadow-inner">
            <CheckCircle className="h-10 w-10 animate-bounce" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-800">Check-in Complete!</h2>
            <p className="text-sm text-slate-500">
              Thank you, <span className="font-bold text-slate-700">{fullName}</span>. Your paperless medical intake record has been loaded into our clinical system.
            </p>
          </div>
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-left text-xs text-slate-500 space-y-1">
            <p className="font-medium text-slate-700">Next Steps:</p>
            <p>1. Please have a seat in the waiting lounge.</p>
            <p>2. The dentist will call you for treatment shortly.</p>
            <p>3. Patient UID: <span className="font-mono font-bold text-slate-600">{submittedId.substring(0, 8)}</span></p>
          </div>
          <button
            onClick={() => {
              // Reset to step 1 for a new patient
              setFullName('');
              setDateOfBirth('');
              setContactNumber('');
              setEmail('');
              setEmergencyContact('');
              setAllergiesList([]);
              setSelectedConditions([]);
              setMedicalNotes('');
              setConsentChecked(false);
              setSignatureData(null);
              setSubmittedId(null);
              setStep(1);
            }}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all text-sm cursor-pointer shadow-lg shadow-slate-900/10 active:scale-95"
          >
            Start Another Registration
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Top Banner */}
      <div className="bg-white border-b border-slate-200 py-4 px-6 shadow-sm">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 bg-emerald-600 text-white rounded-xl flex items-center justify-center font-bold text-lg">D</div>
            <div>
              <h2 className="font-extrabold text-slate-800 text-sm tracking-tight">DentoCare Clinics</h2>
              <p className="text-[10px] text-slate-400 font-medium">Digital Intake Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1 font-medium">
            <Clock className="h-3.5 w-3.5" />
            <span>Interactive Console</span>
          </div>
        </div>
      </div>

      {/* Main Intake Form Form */}
      <div className="flex-1 py-8 px-4 flex items-center justify-center">
        <div className="bg-white rounded-3xl border border-slate-200/60 shadow-xl max-w-2xl w-full overflow-hidden flex flex-col md:min-h-[500px]">
          {/* Progress Tracker */}
          <div className="bg-slate-50 border-b border-slate-100 p-6 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <span className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs border ${
                step >= 1 ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-200 text-slate-400'
              }`}>
                1
              </span>
              <div className="h-0.5 w-8 bg-slate-200" />
              <span className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs border ${
                step >= 2 ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-200 text-slate-400'
              }`}>
                2
              </span>
              <div className="h-0.5 w-8 bg-slate-200" />
              <span className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs border ${
                step >= 3 ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-200 text-slate-400'
              }`}>
                3
              </span>
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Step {step} of 3: {step === 1 ? 'Personal Info' : step === 2 ? 'Medical Details' : 'Consent Sign-off'}
            </span>
          </div>

          {/* Alert messages */}
          {errorMsg && (
            <div className="bg-rose-50 border-b border-rose-100 p-4 text-xs font-bold text-rose-700 flex justify-between items-center">
              <span>{errorMsg}</span>
              <button onClick={() => setErrorMsg('')} className="text-rose-500 hover:text-rose-700">✕</button>
            </div>
          )}

          {/* Form Content */}
          <div className="p-6 md:p-8 flex-1">
            {step === 1 && (
              <div className="space-y-5 animate-fade-in">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-sm border-b border-slate-100 pb-2">
                  <User className="h-4.5 w-4.5 text-emerald-600" />
                  <h3>Personal Information</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="As listed on ID"
                      className="w-full border border-slate-200 focus:border-emerald-500 focus:outline-none rounded-xl px-4 py-3 text-sm transition-all"
                    />
                  </div>

                  {/* DOB */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500">Date of Birth *</label>
                    <input
                      type="date"
                      required
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="w-full border border-slate-200 focus:border-emerald-500 focus:outline-none rounded-xl px-4 py-3 text-sm text-slate-700 transition-all"
                    />
                  </div>

                  {/* Gender */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500">Gender *</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full border border-slate-200 focus:border-emerald-500 focus:outline-none rounded-xl px-4 py-3 text-sm bg-white cursor-pointer transition-all"
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  {/* Contact Number */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500">Mobile Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full border border-slate-200 focus:border-emerald-500 focus:outline-none rounded-xl px-4 py-3 text-sm transition-all"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500">Email Address (Optional)</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      className="w-full border border-slate-200 focus:border-emerald-500 focus:outline-none rounded-xl px-4 py-3 text-sm transition-all"
                    />
                  </div>

                  {/* Emergency Contact */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500">Emergency Contact Name & Phone *</label>
                    <input
                      type="text"
                      required
                      value={emergencyContact}
                      onChange={(e) => setEmergencyContact(e.target.value)}
                      placeholder="e.g. Mary Doe - 9876543211"
                      className="w-full border border-slate-200 focus:border-emerald-500 focus:outline-none rounded-xl px-4 py-3 text-sm transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5 animate-fade-in">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-sm border-b border-slate-100 pb-2">
                  <ShieldAlert className="h-4.5 w-4.5 text-emerald-600" />
                  <h3>Medical History Questionnaire</h3>
                </div>

                {/* Chronic Conditions */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Do you suffer from any of the following? (Select all that apply)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {CHRONIC_CONDITIONS.map(cond => {
                      const isSelected = selectedConditions.includes(cond);
                      return (
                        <button
                          key={cond}
                          type="button"
                          onClick={() => toggleCondition(cond)}
                          className={`px-4 py-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-sm' 
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {cond}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Drug / Substance Allergies */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500">List any Allergies (e.g., Penicillin, Latex)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter allergy and click Add"
                      value={allergyInput}
                      onChange={(e) => setAllergyInput(e.target.value)}
                      className="flex-1 border border-slate-200 focus:border-emerald-500 focus:outline-none rounded-xl px-4 py-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={addAllergy}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer active:scale-95"
                    >
                      Add
                    </button>
                  </div>
                  {allergiesList.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                      {allergiesList.map((all, i) => (
                        <span key={i} className="inline-flex items-center gap-1 bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-lg text-xs">
                          {all}
                          <button type="button" onClick={() => removeAllergy(i)} className="text-slate-400 hover:text-rose-500 font-extrabold text-sm ml-1">×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* General Remarks */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">Other Diagnostic / Medical Remarks</label>
                  <textarea
                    rows={2}
                    value={medicalNotes}
                    onChange={(e) => setMedicalNotes(e.target.value)}
                    placeholder="Enter details on recent surgeries, medications, or specific dental complaints..."
                    className="w-full border border-slate-200 focus:border-emerald-500 focus:outline-none rounded-xl px-4 py-2 text-sm resize-none"
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5 animate-fade-in">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-sm border-b border-slate-100 pb-2">
                  <FileText className="h-4.5 w-4.5 text-emerald-600" />
                  <h3>Intake Consent Signature</h3>
                </div>

                {/* Consent text */}
                <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl text-xs text-slate-500 leading-relaxed max-h-40 overflow-y-auto space-y-2">
                  <p className="font-bold text-slate-700">1. Consent to Dental Services</p>
                  <p>
                    I hereby authorize the dentists and clinical staff of DentoCare to perform dental diagnostic operations, treatments, local anesthetics administration, and clinical treatments as deemed necessary.
                  </p>
                  <p className="font-bold text-slate-700">2. Accuracy of History</p>
                  <p>
                    I certify that the information, conditions, allergies, and contact data filled in this check-in form are correct to the best of my knowledge.
                  </p>
                </div>

                {/* Consent checkbox */}
                <label className="flex items-start gap-3 bg-white p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={consentChecked}
                    onChange={(e) => setConsentChecked(e.target.checked)}
                    className="mt-1 h-4.5 w-4.5 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded cursor-pointer"
                  />
                  <div className="text-xs">
                    <p className="font-bold text-slate-700">Confirm Digital Sign-off</p>
                    <p className="text-slate-400">I agree to DentoCare clinical terms of service & privacy protocols.</p>
                  </div>
                </label>

                {/* Canvas signature */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-500 flex items-center gap-1">
                      <PenTool className="h-4 w-4" />
                      Sign inside this box (Touch or Mouse)
                    </label>
                    <button
                      type="button"
                      onClick={clearSignature}
                      className="text-xs font-bold text-rose-600 hover:text-rose-500 flex items-center gap-1 cursor-pointer bg-white px-2 py-1 border border-slate-100 rounded-lg shadow-sm"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Clear Signature
                    </button>
                  </div>
                  <div className="border-2 border-dashed border-slate-200 rounded-2xl overflow-hidden bg-slate-50 h-44 relative">
                    <canvas
                      ref={canvasRef}
                      onMouseDown={handleStartDraw}
                      onMouseMove={handleDraw}
                      onMouseUp={handleStopDraw}
                      onMouseLeave={handleStopDraw}
                      onTouchStart={handleStartDraw}
                      onTouchMove={handleDraw}
                      onTouchEnd={handleStopDraw}
                      className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Navigation Buttons */}
          <div className="bg-slate-50 border-t border-slate-100 p-6 flex justify-between items-center gap-4">
            {step > 1 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={submitting}
                className="px-5 py-3 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-md shadow-slate-950/10"
              >
                Next Step
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !consentChecked || !signatureData}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-md shadow-emerald-950/10 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Patient Check-in'}
                <CheckCircle className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Footer message */}
      <div className="py-4 text-center text-slate-400 text-[10px] font-medium border-t border-slate-200 bg-white">
        &copy; DentoCare Clinical Systems - Paperless Intake Portal. Secure & HIPAA compliant.
      </div>
    </div>
  );
}
