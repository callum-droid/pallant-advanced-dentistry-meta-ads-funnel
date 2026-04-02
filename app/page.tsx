"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";

// ─── TYPES ────────────────────────────────────────────────────────
interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  concerns: string[];
  treatment: string;
  timeline: string;
  previousTreatment: string;
  completedSteps: number;
  submittedAt: string | null;
}

// ─── DATA ─────────────────────────────────────────────────────────
const CONCERN_OPTIONS = [
  { value: "single-missing", icon: "🦷", label: "Missing Single Tooth" },
  { value: "multiple-missing", icon: "😶", label: "Multiple Missing Teeth" },
  { value: "failing-teeth", icon: "⚠️", label: "Failing or Damaged Teeth" },
  { value: "dentures", icon: "😣", label: "Unhappy with Dentures" },
  { value: "decay", icon: "🔴", label: "Decay or Infection" },
  { value: "confidence", icon: "😊", label: "Want to Boost Confidence" },
  { value: "referred", icon: "👨‍⚕️", label: "Referred by My Dentist" },
  { value: "unsure", icon: "🤔", label: "Not Sure Yet" },
];

const TREATMENT_OPTIONS = [
  { value: "single-implant", label: "Single Dental Implant" },
  { value: "multiple-implants", label: "Multiple Dental Implants" },
  { value: "implant-bridge", label: "Implant-Supported Bridge" },
  { value: "all-on-4", label: "All-on-4 / Full Arch Replacement" },
  { value: "unsure", label: "I'd like professional advice" },
];

const TIMELINE_OPTIONS = [
  { value: "asap", label: "As soon as possible" },
  { value: "1-3months", label: "Within the next 1–3 months" },
  { value: "3-6months", label: "3–6 months from now" },
  { value: "exploring", label: "Just exploring options for now" },
];

const STEP_LABELS = ["Your Details", "Your Situation", "Treatment", "Timeline"];

// ─── COMPONENT ────────────────────────────────────────────────────
export default function DentalImplantFunnel() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    concerns: [],
    treatment: "",
    timeline: "",
    previousTreatment: "",
    completedSteps: 0,
    submittedAt: null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shakeFields, setShakeFields] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const lastSavedStep = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);

  // ─── EXIT INTENT POPUP ────────────────────────────────────────


  // ─── TAP FEEDBACK STATE ─────────────────────────────────────────
  const [tappedOption, setTappedOption] = useState<string | null>(null);
  const triggerTap = (key: string) => {
    setTappedOption(key);
    setTimeout(() => setTappedOption(null), 200);
  };

  // ─── PROGRESSIVE LEAD CAPTURE ─────────────────────────────────
  const saveProgress = useCallback(
    (stepJustCompleted: number, data: FormData) => {
      if (stepJustCompleted <= lastSavedStep.current) return;
      lastSavedStep.current = stepJustCompleted;

      const payload = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        ...(stepJustCompleted >= 2 && { concerns: data.concerns }),
        ...(stepJustCompleted >= 3 && { treatment: data.treatment }),
        completedSteps: stepJustCompleted,
        status: "partial",
        updatedAt: new Date().toISOString(),
      };

      console.log(
        `💾 PROGRESS SAVED (step ${stepJustCompleted}/4):`,
        JSON.stringify(payload, null, 2)
      );
    },
    []
  );

  useEffect(() => {
    const handleUnload = () => {
      if (lastSavedStep.current === 0 && currentStep === 1) {
        if (formData.firstName.trim() && formData.email.trim()) {
          saveProgress(1, formData);
        }
      }
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [currentStep, formData, saveProgress]);

  // ─── VALIDATION ───────────────────────────────────────────────
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    if (step === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = "Please enter your first name";
      if (!formData.lastName.trim()) newErrors.lastName = "Please enter your last name";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Please enter a valid email address";
      if (formData.phone.replace(/\s/g, "").length < 7) newErrors.phone = "Please enter your phone number";
    }
    if (step === 2 && formData.concerns.length === 0) newErrors.concerns = "Please select at least one option";
    if (step === 3 && !formData.treatment) newErrors.treatment = "Please select an option";
    if (step === 3 && !formData.previousTreatment) newErrors.previousTreatment = "Please answer this question";
    if (step === 4 && !formData.timeline) newErrors.timeline = "Please select a timeline";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      const shaking: Record<string, boolean> = {};
      Object.keys(newErrors).forEach((k) => { shaking[k] = true; });
      setShakeFields(shaking);
      setTimeout(() => setShakeFields({}), 500);
      setTimeout(() => {
        const firstKey = Object.keys(newErrors)[0];
        const el = document.querySelector(`[data-error="${firstKey}"]`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
    }
    return Object.keys(newErrors).length === 0;
  };

  // ─── NAVIGATION ───────────────────────────────────────────────
  const nextStep = () => {
    if (!validateStep(currentStep)) return;
    const updatedData = { ...formData, completedSteps: Math.max(formData.completedSteps, currentStep) };
    setFormData(updatedData);
    saveProgress(currentStep, updatedData);
    if (currentStep < 4) { setCurrentStep((s) => s + 1); setErrors({}); }
  };

  const prevStep = () => {
    if (currentStep > 1) { setCurrentStep((s) => s - 1); setErrors({}); }
  };

  const toggleConcern = (value: string) => {
    triggerTap(`concern-${value}`);
    setFormData((prev) => ({
      ...prev,
      concerns: prev.concerns.includes(value) ? prev.concerns.filter((c) => c !== value) : [...prev.concerns, value],
    }));
    setErrors((prev) => { const next = { ...prev }; delete next.concerns; return next; });
  };

  // ─── TREATMENT SELECTION ──────────────────────────────────────
  const selectTreatment = (value: string) => {
    triggerTap(`treatment-${value}`);
    setFormData((prev) => ({ ...prev, treatment: value }));
    setErrors((prev) => { const next = { ...prev }; delete next.treatment; return next; });
  };

  const selectTimelineAndContinue = (value: string) => {
    triggerTap(`timeline-${value}`);
    setFormData((prev) => ({ ...prev, timeline: value }));
    setErrors((prev) => { const next = { ...prev }; delete next.timeline; return next; });
  };

  // ─── SUBMIT ───────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validateStep(4)) return;
    setSubmitting(true);
    try {
      await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
    } catch (e) {
      console.error("Submission error:", e);
    }
    setSubmitted(true);
    setSubmitting(false);
  };

  // ─── RENDER ───────────────────────────────────────────────────
  return (
    <>
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap");

        :root {
          --primary: #1A3F52;
          --primary-light: #264F65;
          --accent: #b8b175;
          --accent-hover: #a09f60;
          --bg: #F5F2ED;
          --bg-card: #ffffff;
          --text: #1a1a1a;
          --text-muted: #6b7280;
          --text-light: #9ca3af;
          --border: #e5e1da;
          --success: #2d8a56;
          --error: #d14343;
          --radius: 14px;
          --shadow: 0 4px 24px rgba(26, 63, 82, 0.08);
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
          font-family: "Montserrat", sans-serif;
          background: var(--bg);
          color: var(--text);
          min-height: 100vh;
          -webkit-font-smoothing: antialiased;
        }

        /* Remove tap highlight flash on mobile */
        * { -webkit-tap-highlight-color: transparent; }

        /* Eliminate 300ms tap delay on interactive elements */
        button, [role="button"], input, select, textarea, a {
          touch-action: manipulation;
        }

        /* Prevent text selection on option cards */
        .option-card-touch, .option-item-touch {
          user-select: none;
          -webkit-user-select: none;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        @keyframes tapBounce {
          0% { transform: scale(1); }
          50% { transform: scale(0.96); }
          100% { transform: scale(1); }
        }

        /* ── MOBILE STYLES ── */
        @media (max-width: 640px) {
          .page-wrapper {
            padding: 12px 14px 16px !important;
            justify-content: flex-start !important;
            align-items: stretch !important;
          }
          .urgency-banner {
            margin-bottom: 8px !important;
            padding: 8px 12px !important;
            font-size: 12px !important;
            justify-content: center !important;
            text-align: center !important;
            flex-wrap: wrap !important;
          }
          .page-header {
            margin-bottom: 8px !important;
          }
          /* Shrink logo on mobile */
          .pallant-logo {
            height: 38px !important;
          }
          .header-title {
            font-size: 17px !important;
            margin-bottom: 4px !important;
          }
          .header-subtitle {
            font-size: 13px !important;
            margin-bottom: 6px !important;
          }
          /* Hide finance badge on mobile — saves ~40px vertical space */
          .finance-badge {
            display: none !important;
          }
          .step-labels-desktop {
            display: none !important;
          }
          .step-indicator-mobile {
            display: flex !important;
          }
          /* Keep 2-column grid on mobile — 8 items in 1 column is too long */
          .concern-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 8px !important;
          }
          .option-card-touch {
            min-height: 60px !important;
            padding: 12px 8px !important;
          }
          .option-item-touch {
            min-height: 54px !important;
            padding: 14px 14px !important;
          }
          .btn-row-mobile {
            flex-direction: column !important;
          }
          .btn-row-mobile button {
            width: 100% !important;
            flex: none !important;
          }
          .form-card {
            padding: 22px 16px !important;
          }
          .sticky-cta {
            display: flex !important;
          }
          .inline-cta {
            display: none !important;
          }
          footer {
            padding-bottom: calc(80px + env(safe-area-inset-bottom)) !important;
          }
        }

        @media (min-width: 641px) {
          .step-indicator-mobile {
            display: none !important;
          }
          .sticky-cta {
            display: none !important;
          }
        }
      `}</style>

      <div style={s.pageWrapper} className="page-wrapper">
        <div style={s.orbTopRight} />
        <div style={s.orbBottomLeft} />

        <div style={s.container}>

          {/* ── URGENCY BANNER ── */}
          <div style={s.urgencyBanner} className="urgency-banner">
            <span style={s.urgencyDot} />
            <span><strong>Book Your Free Dental Implant Consultation</strong></span>
          </div>

          {/* ── HEADER ── */}
          <div style={s.header} className="page-header">
            <div style={s.logoRow}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://www.pallantadvanceddentistry.co.uk/application/themes/syed_tio_site/images/pallant-logo.png"
                alt="Pallant Advanced Dentistry"
                className="pallant-logo"
                style={s.logo}
              />
            </div>
            <h1 style={s.headerTitle} className="header-title">Restore Your Smile With Confidence</h1>
            <p style={s.headerSubtitle} className="header-subtitle">
              Book a free dental implant consultation with our specialist team to explore your options and receive personalised guidance.
            </p>

            <div style={s.financeBadge} className="finance-badge">
              Award-winning practice in Chichester · Finance options available
            </div>
          </div>

          {!submitted && (
            <div style={s.stepper}>
              {STEP_LABELS.map((label, i) => {
                const step = i + 1;
                const isComplete = step < currentStep;
                const isActive = step === currentStep;
                return (
                  <React.Fragment key={label}>
                    <div style={s.stepperItem}>
                      <div style={{
                        ...s.stepperCircle,
                        background: isComplete ? "var(--accent)" : isActive ? "var(--primary)" : "transparent",
                        borderColor: isComplete ? "var(--accent)" : isActive ? "var(--primary)" : "var(--border)",
                        color: isComplete || isActive ? "#fff" : "var(--text-light)",
                      }}>
                        {isComplete ? "✓" : step}
                      </div>
                      <span style={{
                        ...s.stepperLabel,
                        color: isActive ? "var(--primary)" : isComplete ? "var(--accent)" : "var(--text-light)",
                        fontWeight: isActive ? 700 : 500,
                      }}>
                        {label}
                      </span>
                    </div>
                    {step < 4 && (
                      <div style={{
                        ...s.stepperLine,
                        background: step < currentStep ? "var(--accent)" : "var(--border)",
                      }} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          )}

          {/* ── CARD ── */}
          <div ref={cardRef} style={s.card} className="form-card">

            <div style={s.cardTopBorder} />

            {/* STEP 1: Contact Details */}
            {currentStep === 1 && !submitted && (
              <div style={{ animation: "fadeIn 0.4s ease-out" }}>
                <h2 style={s.stepTitle}>Let&apos;s get started</h2>
                <p style={s.stepSubtitle}>Enter your details so we can personalise your implant consultation</p>

                {([
                  { id: "firstName", label: "First Name", placeholder: "First Name", type: "text", inputMode: "text" as const },
                  { id: "lastName", label: "Last Name", placeholder: "Last Name", type: "text", inputMode: "text" as const },
                  { id: "email", label: "Email Address", placeholder: "Email Address", type: "email", inputMode: "email" as const },
                  { id: "phone", label: "Phone Number", placeholder: "Phone Number", type: "tel", inputMode: "tel" as const },
                ] as const).map((field) => (
                  <div key={field.id} style={s.fieldGroup}>
                    <input
                      type={field.type}
                      inputMode={field.inputMode}
                      placeholder={field.placeholder}
                      value={formData[field.id]}
                      onChange={(e) => {
                        const value = field.id === "phone"
                          ? e.target.value.replace(/[^\d\s\+\-\(\)]/g, "")
                          : e.target.value;
                        setFormData((prev) => ({ ...prev, [field.id]: value }));
                        setErrors((prev) => { const next = { ...prev }; delete next[field.id]; return next; });
                      }}
                      style={{
                        ...s.input,
                        borderColor: errors[field.id] ? "var(--error)" : "var(--border)",
                        boxShadow: errors[field.id] ? "0 0 0 3px rgba(209,67,67,0.1)" : "none",
                      }}
                    />
                    {errors[field.id] && <span data-error={field.id} style={s.fieldError}>{errors[field.id]}</span>}
                  </div>
                ))}

                <p style={s.privacyNote}>
                  <svg viewBox="0 0 24 24" width={12} height={12} fill="none" stroke="currentColor" strokeWidth={2} style={{ marginRight: 4, verticalAlign: "middle" }}>
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                  We&apos;ll never share your details. 100% confidential.
                </p>

                <div style={s.btnRow} className="btn-row-mobile inline-cta">
                  <button style={s.btnPrimary} onClick={nextStep}>Continue →</button>
                </div>
              </div>
            )}

            {/* STEP 2: Situation */}
            {currentStep === 2 && !submitted && (
              <div style={{ animation: "fadeIn 0.4s ease-out" }}>
                <h2 style={s.stepTitle}>What&apos;s brought you here today?</h2>
                <p style={s.stepSubtitle}>Select the reasons you&apos;re considering dental implants (choose all that apply)</p>
                {errors.concerns && <p data-error="concerns" style={s.selectionErrorTop}>{errors.concerns}</p>}

                <div style={{ ...s.optionGrid, animation: shakeFields.concerns ? "shake 0.5s ease-out" : "none" }} className="concern-grid">
                  {CONCERN_OPTIONS.map((opt) => {
                    const selected = formData.concerns.includes(opt.value);
                    const isTapped = tappedOption === `concern-${opt.value}`;
                    return (
                      <div key={opt.value} onClick={() => toggleConcern(opt.value)} className="option-card-touch" style={{
                        ...s.optionCard,
                        borderColor: selected ? "var(--primary)" : "var(--border)",
                        background: selected ? "rgba(26,63,82,0.06)" : "var(--bg)",
                        boxShadow: selected ? "0 0 0 3px rgba(26,63,82,0.1)" : "none",
                        animation: isTapped ? "tapBounce 0.2s ease-out" : "none",
                      }}>
                        {selected && (
                          <div style={s.checkMark}>
                            <svg viewBox="0 0 24 24" width={12} height={12} fill="none" stroke="white" strokeWidth={3}>
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </div>
                        )}
                        <span style={s.optionIcon}>{opt.icon}</span>
                        <span style={s.optionLabel}>{opt.label}</span>
                      </div>
                    );
                  })}
                </div>

                <p style={s.stepEncouragement}>Great progress — just 2 quick questions left!</p>

                <div style={s.btnRow} className="btn-row-mobile inline-cta">
                  <button style={s.btnSecondary} onClick={prevStep}>← Back</button>
                  <button style={s.btnPrimary} onClick={nextStep}>Continue →</button>
                </div>
              </div>
            )}

            {/* STEP 3: Treatment Interest (auto-advance) */}
            {currentStep === 3 && !submitted && (
              <div style={{ animation: "fadeIn 0.4s ease-out" }}>
                <h2 style={s.stepTitle}>Which treatment interests you?</h2>
                <p style={s.stepSubtitle}>Select the implant option you&apos;d like to explore</p>
                {errors.treatment && <p data-error="treatment" style={s.selectionErrorTop}>{errors.treatment}</p>}

                <div style={{ ...s.optionList, animation: shakeFields.treatment ? "shake 0.5s ease-out" : "none" }}>
                  {TREATMENT_OPTIONS.map((opt) => {
                    const selected = formData.treatment === opt.value;
                    const isTapped = tappedOption === `treatment-${opt.value}`;
                    return (
                      <div key={opt.value} onClick={() => selectTreatment(opt.value)} className="option-item-touch" style={{
                        ...s.optionItem,
                        borderColor: selected ? "var(--primary)" : "var(--border)",
                        background: selected ? "rgba(26,63,82,0.06)" : "var(--bg)",
                        boxShadow: selected ? "0 0 0 3px rgba(26,63,82,0.1)" : "none",
                        animation: isTapped ? "tapBounce 0.2s ease-out" : "none",
                      }}>
                        <div style={{
                          ...s.radioCircle,
                          borderColor: selected ? "var(--primary)" : "var(--border)",
                          background: selected ? "var(--primary)" : "transparent",
                        }}>
                          {selected && <div style={s.radioDot} />}
                        </div>
                        <span style={s.optionText}>{opt.label}</span>
                      </div>
                    );
                  })}
                </div>

                <div style={{ marginTop: 20 }}>
                  <label style={s.label}>Have you had any teeth extracted or removed previously?</label>
                  {errors.previousTreatment && <p data-error="previousTreatment" style={s.selectionErrorTop}>{errors.previousTreatment}</p>}
                  <div style={{ ...s.optionList, marginTop: 8, animation: shakeFields.previousTreatment ? "shake 0.5s ease-out" : "none" }}>
                    {["Yes", "No"].map((opt) => {
                      const val = opt.toLowerCase();
                      const selected = formData.previousTreatment === val;
                      const isTapped = tappedOption === `prev-${val}`;
                      return (
                        <div key={val} onClick={() => {
                          triggerTap(`prev-${val}`);
                          setFormData((prev) => ({ ...prev, previousTreatment: val }));
                        }} className="option-item-touch" style={{
                          ...s.optionItem,
                          borderColor: selected ? "var(--primary)" : "var(--border)",
                          background: selected ? "rgba(26,63,82,0.06)" : "var(--bg)",
                          boxShadow: selected ? "0 0 0 3px rgba(26,63,82,0.1)" : "none",
                          animation: isTapped ? "tapBounce 0.2s ease-out" : "none",
                        }}>
                          <div style={{
                            ...s.radioCircle,
                            borderColor: selected ? "var(--primary)" : "var(--border)",
                            background: selected ? "var(--primary)" : "transparent",
                          }}>
                            {selected && <div style={s.radioDot} />}
                          </div>
                          <span style={s.optionText}>{opt}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <p style={s.stepEncouragement}>Nearly there — one final step!</p>

                <div style={s.btnRow} className="btn-row-mobile inline-cta">
                  <button style={s.btnSecondary} onClick={prevStep}>← Back</button>
                  <button style={s.btnPrimary} onClick={nextStep}>Continue →</button>
                </div>
              </div>
            )}

            {/* STEP 4: Timeline */}
            {currentStep === 4 && !submitted && (
              <div style={{ animation: "fadeIn 0.4s ease-out" }}>
                <h2 style={s.stepTitle}>Your timeline</h2>
                <p style={s.stepSubtitle}>When are you hoping to start treatment?</p>
                {errors.timeline && <p data-error="timeline" style={s.selectionErrorTop}>{errors.timeline}</p>}

                <div style={{ ...s.optionList, animation: shakeFields.timeline ? "shake 0.5s ease-out" : "none" }}>
                  {TIMELINE_OPTIONS.map((opt) => {
                    const selected = formData.timeline === opt.value;
                    const isTapped = tappedOption === `timeline-${opt.value}`;
                    return (
                      <div key={opt.value} onClick={() => selectTimelineAndContinue(opt.value)} className="option-item-touch" style={{
                        ...s.optionItem,
                        borderColor: selected ? "var(--primary)" : "var(--border)",
                        background: selected ? "rgba(26,63,82,0.06)" : "var(--bg)",
                        boxShadow: selected ? "0 0 0 3px rgba(26,63,82,0.1)" : "none",
                        animation: isTapped ? "tapBounce 0.2s ease-out" : "none",
                      }}>
                        <div style={{
                          ...s.radioCircle,
                          borderColor: selected ? "var(--primary)" : "var(--border)",
                          background: selected ? "var(--primary)" : "transparent",
                        }}>
                          {selected && <div style={s.radioDot} />}
                        </div>
                        <span style={s.optionText}>{opt.label}</span>
                      </div>
                    );
                  })}
                </div>
                <div style={s.btnRow} className="btn-row-mobile inline-cta">
                  <button style={s.btnSecondary} onClick={prevStep}>← Back</button>
                  <button style={{
                    ...s.btnSubmit,
                    opacity: submitting ? 0.7 : 1,
                    pointerEvents: submitting ? "none" : "auto",
                  }} onClick={handleSubmit}>
                    {submitting ? "Submitting..." : "Book Free Consultation"}
                  </button>
                </div>
              </div>
            )}

            {/* SUCCESS */}
            {submitted && (
              <div style={{ animation: "scaleIn 0.5s ease-out" }}>
                <div style={{ textAlign: "center", padding: "32px 0" }}>
                  <div style={s.successIcon}>
                    <svg viewBox="0 0 24 24" width={32} height={32} fill="none" stroke="white" strokeWidth={2.5}>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <h2 style={s.successTitle}>Thank You for Your Enquiry</h2>
                  <p style={s.successText}>
                    A member of our team at Pallant Advanced Dentistry will be in touch shortly to arrange your free dental implant consultation.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Trust badges */}
          <div style={s.trustRow}>
            <TrustBadge icon="shield" text="100% Confidential" />
            <TrustBadge icon="check" text="Free Consultation" />
            <TrustBadge icon="clock" text="2 Min to Complete" />
          </div>

          {/* YouTube Short — step 1 only */}
          {currentStep === 1 && !submitted && (
            <div style={s.videoWrap}>
              <p style={s.videoTitle}>Are implants the right option for you?</p>
              <iframe
                src="https://www.youtube.com/embed/rxoTVdsSQKI?mute=1"
                title="Pallant Advanced Dentistry"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={s.videoFrame}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── FOOTER POLICY LINKS ── */}
      <footer style={s.footer}>
        <a href="https://www.pallantadvanceddentistry.co.uk/privacy-policy" target="_blank" rel="noopener noreferrer" style={s.footerLink}>Privacy Policy</a>
        <span style={s.footerDot}>·</span>
        <a href="https://www.pallantadvanceddentistry.co.uk/terms-and-conditions" target="_blank" rel="noopener noreferrer" style={s.footerLink}>Terms & Conditions</a>
        <span style={s.footerDot}>·</span>
        <a href="https://www.pallantadvanceddentistry.co.uk/cookies-policy" target="_blank" rel="noopener noreferrer" style={s.footerLink}>Cookies Policy</a>
        <span style={s.footerDot}>·</span>
        <a href="https://www.pallantadvanceddentistry.co.uk/complaints-handling-policy" target="_blank" rel="noopener noreferrer" style={s.footerLink}>Complaints Policy</a>
        <span style={s.footerDot}>·</span>
        <a href="https://www.pallantadvanceddentistry.co.uk/environmental-policy/" target="_blank" rel="noopener noreferrer" style={s.footerLink}>Environmental Policy</a>
      </footer>

      {/* ── STICKY CTA (mobile only) ── */}
      {!submitted && (
        <div style={s.stickyCta} className="sticky-cta">
          {currentStep > 1 && (
            <button style={s.stickyBtnSecondary} onClick={prevStep}>← Back</button>
          )}
          {currentStep < 4 ? (
            <button style={s.stickyBtnPrimary} onClick={nextStep}>Continue →</button>
          ) : (
            <button style={{
              ...s.stickyBtnSubmit,
              opacity: submitting ? 0.7 : 1,
              pointerEvents: submitting ? "none" : "auto",
            }} onClick={handleSubmit}>
              {submitting ? "Submitting..." : "Book Free Consultation"}
            </button>
          )}
        </div>
      )}

    </>
  );
}

// ─── TRUST BADGE ──────────────────────────────────────────────────
function TrustBadge({ icon, text }: { icon: string; text: string }) {
  const paths: Record<string, React.ReactNode> = {
    shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
    check: <><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>,
    clock: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>,
  };
  return (
    <div style={s.trustItem}>
      <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="var(--text-light)" strokeWidth={2}>
        {paths[icon]}
      </svg>
      <span>{text}</span>
    </div>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  pageWrapper: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    padding: "20px 20px 16px",
    position: "relative",
    overflow: "hidden",
  },

  orbTopRight: {
    position: "fixed", top: "-30%", right: "-20%",
    width: 600, height: 600, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(26,63,82,0.06) 0%, transparent 70%)",
    pointerEvents: "none",
  },

  orbBottomLeft: {
    position: "fixed", bottom: "-20%", left: "-15%",
    width: 500, height: 500, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(184,177,117,0.07) 0%, transparent 70%)",
    pointerEvents: "none",
  },

  container: { width: "100%", maxWidth: 520, position: "relative", zIndex: 1 },

  urgencyBanner: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    gap: 8,
    background: "linear-gradient(135deg, #1A3F52, #264F65)",
    color: "white",
    padding: "10px 16px",
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 500,
    marginBottom: 20,
    animation: "fadeDown 0.5s ease-out",
  },

  urgencyDot: {
    width: 8, height: 8,
    borderRadius: "50%",
    background: "#b8b175",
    animation: "pulse 2s ease-in-out infinite",
    flexShrink: 0,
    marginTop: 4,
  },

  header: { textAlign: "center", marginBottom: 20, animation: "fadeDown 0.6s ease-out" },

  logoRow: { display: "flex", justifyContent: "center", marginBottom: 14 },

  logo: { height: 56, width: "auto", objectFit: "contain" },

  headerTitle: {
    fontFamily: "'Montserrat', sans-serif",
    fontSize: 22, fontWeight: 400, color: "var(--primary)", lineHeight: 1.2, marginBottom: 8,
  },

  headerSubtitle: { color: "var(--text-muted)", fontSize: 15, lineHeight: 1.5, marginBottom: 10 },

  financeBadge: {
    display: "inline-block",
    background: "rgba(184,177,117,0.12)",
    color: "#6b6640",
    padding: "8px 16px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    border: "1px solid rgba(184,177,117,0.25)",
  },

  stepper: {
    display: "flex", alignItems: "center",
    marginBottom: 28,
    animation: "fadeDown 0.6s ease-out 0.1s both",
  },

  stepperItem: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
    flexShrink: 0,
  },

  stepperCircle: {
    width: 32, height: 32, borderRadius: "50%",
    border: "2px solid",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 13, fontWeight: 700,
    transition: "background 0.4s, border-color 0.4s, color 0.4s",
  },

  stepperLabel: {
    fontSize: 11, textTransform: "uppercase" as const,
    letterSpacing: "0.07em", transition: "color 0.4s",
    textAlign: "center" as const, whiteSpace: "nowrap" as const,
  },

  stepperLine: {
    flex: 1, height: 2, borderRadius: 2,
    transition: "background 0.4s",
    margin: "0 6px", marginBottom: 22,
  },

  card: {
    background: "var(--bg-card)", borderRadius: "var(--radius)",
    boxShadow: "var(--shadow)", padding: "36px 32px",
    position: "relative", overflow: "hidden",
    border: "1px solid rgba(0,0,0,0.04)",
    scrollMarginTop: 10,
  },

  cardTopBorder: {
    position: "absolute", top: 0, left: 0, right: 0, height: 3,
    background: "linear-gradient(90deg, var(--primary), var(--accent))",
  },

  stepTitle: {
    fontFamily: "'Montserrat', sans-serif",
    fontSize: 22, color: "var(--primary)", marginBottom: 6,
  },

  stepSubtitle: { color: "var(--text-muted)", fontSize: 14, marginBottom: 28, lineHeight: 1.5 },

  stepEncouragement: {
    fontSize: 13, color: "var(--success)", fontWeight: 500,
    textAlign: "center", marginTop: 4,
  },

  fieldGroup: { marginBottom: 18 },

  label: {
    display: "block", fontSize: 13, fontWeight: 600,
    color: "var(--text)", marginBottom: 7, letterSpacing: "0.01em",
  },

  input: {
    width: "100%", padding: "13px 16px",
    border: "1.5px solid var(--border)", borderRadius: 10,
    fontFamily: "'Montserrat', sans-serif", fontSize: 16,
    color: "var(--text)", background: "var(--bg)",
    outline: "none", transition: "border-color 0.25s, box-shadow 0.25s, background 0.25s",
  },

  fieldError: { fontSize: 12, color: "var(--error)", marginTop: 5, display: "block" },

  privacyNote: {
    fontSize: 12, color: "var(--text-light)", marginTop: 4, marginBottom: 0,
    display: "flex", alignItems: "center",
  },

  optionGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 },

  optionCard: {
    position: "relative", padding: "16px 14px",
    border: "1.5px solid var(--border)", borderRadius: 12,
    cursor: "pointer", transition: "all 0.25s ease", textAlign: "center",
    minHeight: 48,
  },

  checkMark: {
    position: "absolute", top: 8, right: 8, width: 20, height: 20,
    borderRadius: "50%", background: "var(--primary)",
    display: "flex", alignItems: "center", justifyContent: "center",
  },

  optionIcon: { fontSize: 26, marginBottom: 8, display: "block" },

  optionLabel: { fontSize: 13, fontWeight: 600, color: "var(--text)", lineHeight: 1.3 },

  optionList: { display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 },

  optionItem: {
    display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
    border: "1.5px solid var(--border)", borderRadius: 12,
    cursor: "pointer", transition: "all 0.25s ease",
    minHeight: 48,
  },

  radioCircle: {
    width: 20, height: 20, borderRadius: "50%", border: "2px solid var(--border)",
    flexShrink: 0, transition: "all 0.25s", position: "relative",
    display: "flex", alignItems: "center", justifyContent: "center",
  },

  radioDot: { width: 8, height: 8, borderRadius: "50%", background: "white" },

  optionText: { fontSize: 14, fontWeight: 500, color: "var(--text)" },

  selectionError: { fontSize: 12, color: "var(--error)", marginTop: -10, marginBottom: 12 },
  selectionErrorTop: { fontSize: 13, color: "var(--error)", marginBottom: 10, fontWeight: 500 },

  btnRow: { display: "flex", gap: 10, marginTop: 28 },

  btnPrimary: {
    flex: 1, padding: "14px 24px", borderRadius: 10,
    fontFamily: "'Montserrat', sans-serif", fontSize: 16, fontWeight: 600,
    cursor: "pointer", border: "none", background: "var(--accent)",
    color: "white", boxShadow: "0 4px 14px rgba(184,177,117,0.35)",
    transition: "all 0.25s ease",
  },

  btnSecondary: {
    padding: "14px 20px", borderRadius: 10,
    fontFamily: "'Montserrat', sans-serif", fontSize: 16, fontWeight: 600,
    cursor: "pointer", background: "transparent", color: "var(--text-muted)",
    border: "1.5px solid var(--border)", transition: "all 0.25s ease",
  },

  btnSubmit: {
    flex: 1, padding: "14px 24px", borderRadius: 10,
    fontFamily: "'Montserrat', sans-serif", fontSize: 16, fontWeight: 600,
    cursor: "pointer", border: "none", background: "var(--accent)",
    color: "white", boxShadow: "0 4px 14px rgba(184,177,117,0.35)",
    transition: "all 0.25s ease",
  },

  stickyCta: {
    display: "none",
    position: "fixed",
    bottom: 0, left: 0, right: 0,
    padding: "12px 16px",
    paddingBottom: "calc(12px + env(safe-area-inset-bottom))",
    background: "white",
    borderTop: "1px solid var(--border)",
    boxShadow: "0 -4px 20px rgba(0,0,0,0.08)",
    gap: 10,
    zIndex: 100,
  },

  stickyBtnPrimary: {
    flex: 1, padding: "16px 24px", borderRadius: 12,
    fontFamily: "'Montserrat', sans-serif", fontSize: 16, fontWeight: 600,
    cursor: "pointer", border: "none", background: "var(--accent)",
    color: "white", boxShadow: "0 4px 14px rgba(184,177,117,0.35)",
  },

  stickyBtnSecondary: {
    padding: "16px 20px", borderRadius: 12,
    fontFamily: "'Montserrat', sans-serif", fontSize: 16, fontWeight: 600,
    cursor: "pointer", background: "transparent", color: "var(--text-muted)",
    border: "1.5px solid var(--border)",
  },

  stickyBtnSubmit: {
    flex: 1, padding: "16px 24px", borderRadius: 12,
    fontFamily: "'Montserrat', sans-serif", fontSize: 16, fontWeight: 600,
    cursor: "pointer", border: "none", background: "var(--accent)",
    color: "white", boxShadow: "0 4px 14px rgba(184,177,117,0.35)",
  },

  successIcon: {
    width: 72, height: 72, borderRadius: "50%",
    background: "linear-gradient(135deg, var(--success), #34A065)",
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    marginBottom: 20, boxShadow: "0 8px 24px rgba(45,138,86,0.3)",
  },

  successTitle: {
    fontFamily: "'Montserrat', sans-serif",
    fontSize: 24, color: "var(--primary)", marginBottom: 10,
  },

  successText: { color: "var(--text-muted)", fontSize: 14, lineHeight: 1.6, maxWidth: 340, margin: "0 auto" },


  trustRow: {
    display: "flex", justifyContent: "center", gap: 24, marginTop: 12,
    animation: "fadeDown 0.6s ease-out 0.3s both",
  },

  videoWrap: {
    marginTop: 20,
    display: "flex", flexDirection: "column" as const, alignItems: "center",
    animation: "fadeIn 0.6s ease-out 0.3s both",
  },

  videoTitle: {
    fontSize: 15, fontWeight: 700, color: "var(--primary)",
    marginBottom: 12, textAlign: "center" as const,
  },

  videoFrame: {
    width: 315, height: 560,
    border: "none", borderRadius: 12,
  },

  trustItem: { display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-light)" },

  footer: {
    textAlign: "center" as const,
    padding: "8px 16px 24px",
    display: "flex",
    flexWrap: "wrap" as const,
    justifyContent: "center",
    gap: "6px 0",
  },
  footerLink: {
    fontSize: 11,
    color: "var(--text-light)",
    textDecoration: "none",
    padding: "0 6px",
  },
  footerDot: {
    fontSize: 11,
    color: "var(--text-light)",
  },

};
