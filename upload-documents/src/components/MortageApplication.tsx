import React, { useState, useEffect, useRef, useCallback } from 'react';
import Footer from './Footer';
import { useSearchParams } from "react-router-dom";
// Minimal synthetic event type used by DatePicker change handler compatibility
type MinimalEvent = {
  target: {
    closest: (selector: string) => Element | null;
  };
};
import './mortgage.css';
import ProponentCard from './mortgage/ProponentCard';
import GuarantorCard from './mortgage/GuarantorCard';
import mortgageTranslations from '../assets/mortgage-translations.json';
type MortgageTranslations = typeof mortgageTranslations;

// Types
interface Document {
  key: string;
  value: string;
  quantity: number;
}

interface Documentation {
  request_id: string;
  documents: Document[];
  customerId?: string;
  lang?: string;
}

interface Person {
  name: string;
  phoneNumber: string;
  email: string;
  dateOfBirth: string;
  responsibilities: string;
  incomes: string;
  maritalStatus: string;
  employmentStatus: string;
  dependents: string;
}

interface FormState {
  consultant: string;
  purchaseValue: string;
  financingAmount: string;
  otherFinancingAmount: string; // allow empty -> null on submit
  ownCapital: string;
  comments: string;
  rents: string;
  guarantors: Person[];
  proponents: Person[];
  hasGuarantors: boolean;
}

const emptyPerson = (): Person => ({
  name: '',
  phoneNumber: '',
  email: '',
  dateOfBirth: '',
  responsibilities: '',
  incomes: '',
  maritalStatus: '',
  employmentStatus: '',
  dependents: '',
});

const MortageApplication: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  
  // Documentation API state
  const [documentation, setDocumentation] = useState<Documentation | null>(null);
  const [customerId, setCustomerId] = useState<string>('');
  
  // Get DOCUMENTATION_HOST from environment variable
  const DOCUMENTATION_HOST = import.meta.env.VITE_DOCUMENTATION_HOST || "https://wrongurl.com";

  const [form, setForm] = useState<FormState>({
    consultant: '',
    purchaseValue: '',
    financingAmount: '',
    otherFinancingAmount: '',
    ownCapital: '',
    comments: '',
    rents: '',
    guarantors: [],
    proponents: [emptyPerson()],
    hasGuarantors: false,
  });

  const [formErrors, setFormErrors] = useState<Record<string, boolean>>({});
  const [showValidation, setShowValidation] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalType, setModalType] = useState<'success' | 'error'>('success');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const formRef = useRef<HTMLFormElement>(null);
  const applicationSectionRef = useRef<HTMLElement>(null);

  // Fetch documentation from API
  const fetchDocumentation = useCallback(async (tkn: string) => {
    try {
      const response = await fetch(`${DOCUMENTATION_HOST}/mortgage-application/customers?token=${tkn}`);
      if (!response.ok) {
        return; // Don't set documentation if API fails
      }

      const data = await response.json();
      const formattedData: Documentation = {
        request_id: data.request_id,
        documents: data.documents,
        customerId: data.customer_id,
        lang: data.lang,
      };

      setDocumentation(formattedData);
      setCustomerId(data.customer_id || '');
    } catch {
      // Don't set documentation if API fails
    }
  }, [DOCUMENTATION_HOST]);

  // Initialize documentation fetch
  useEffect(() => {
    if (token) {
      fetchDocumentation(token);
    }
  }, [token, fetchDocumentation]);

  // Validation functions
  const validateForm = () => {
    const errors: Record<string, boolean> = {};

    // Required top-level fields
    if (!form.purchaseValue?.trim()) errors.purchaseValue = true;
    
    // Financing validation: either Financing Amount OR Other Financing Amount must be filled
    if (!form.financingAmount?.trim() && !form.otherFinancingAmount?.trim()) {
      errors.financingAmount = true;
      errors.otherFinancingAmount = true;
    }

    // All proponent fields are mandatory
    form.proponents.forEach((proponent, idx) => {
      if (!proponent.name?.trim()) errors[`proponent-${idx}-name`] = true;
      if (!proponent.phoneNumber?.trim()) errors[`proponent-${idx}-phoneNumber`] = true;
      if (!proponent.email?.trim()) errors[`proponent-${idx}-email`] = true;
      if (!proponent.dateOfBirth?.trim()) errors[`proponent-${idx}-dateOfBirth`] = true;
      if (!proponent.responsibilities?.trim()) errors[`proponent-${idx}-responsibilities`] = true;
      if (!proponent.incomes?.trim()) errors[`proponent-${idx}-incomes`] = true;
      if (!proponent.maritalStatus?.trim()) errors[`proponent-${idx}-maritalStatus`] = true;
      if (!proponent.employmentStatus?.trim()) errors[`proponent-${idx}-employmentStatus`] = true;
      if (!proponent.dependents?.trim()) errors[`proponent-${idx}-dependents`] = true;
    });

    // If guarantors exist, their fields are mandatory (except dependents)
    if (form.hasGuarantors) {
      form.guarantors.forEach((guarantor, idx) => {
        if (!guarantor.name?.trim()) errors[`guarantor-${idx}-name`] = true;
        if (!guarantor.dateOfBirth?.trim()) errors[`guarantor-${idx}-dateOfBirth`] = true;
        if (!guarantor.responsibilities?.trim()) errors[`guarantor-${idx}-responsibilities`] = true;
        if (!guarantor.incomes?.trim()) errors[`guarantor-${idx}-incomes`] = true;
        if (!guarantor.maritalStatus?.trim()) errors[`guarantor-${idx}-maritalStatus`] = true;
        if (!guarantor.employmentStatus?.trim()) errors[`guarantor-${idx}-employmentStatus`] = true;
        // Note: dependents is optional for guarantors
      });
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const getValidationClass = (fieldName: string) => {
    if (!showValidation) return '';
    
    // For financing amount special case - both fields need to be checked together
    if (fieldName === 'financingAmount' || fieldName === 'otherFinancingAmount') {
      const hasFinancing = form.financingAmount?.trim();
      const hasOtherFinancing = form.otherFinancingAmount?.trim();
      
      // Show as invalid if both are empty
      if (!hasFinancing && !hasOtherFinancing) {
        return 'is-invalid';
      } else {
        return ''; // Remove validation styling once user fills either field
      }
    }
    
    // For regular fields, only show red if field was marked as error AND is still empty
    const hasError = formErrors[fieldName];
    const fieldValue = getFieldValue(fieldName);
    
    if (hasError && !fieldValue?.trim()) {
      return 'is-invalid';
    }
    return '';
  };

  const getFieldValue = (fieldName: string): string => {
    // Handle top-level form fields
    if (fieldName in form) {
      return form[fieldName as keyof FormState] as string;
    }
    
    // Handle proponent fields
    if (fieldName.startsWith('proponent-')) {
      const parts = fieldName.split('-');
      const idx = parseInt(parts[1]);
      const field = parts[2] as keyof Person;
      return form.proponents[idx]?.[field] || '';
    }
    
    // Handle guarantor fields
    if (fieldName.startsWith('guarantor-')) {
      const parts = fieldName.split('-');
      const idx = parseInt(parts[1]);
      const field = parts[2] as keyof Person;
      return form.guarantors[idx]?.[field] || '';
    }
    
    return '';
  };

  const scrollToApplication = () => {
    applicationSectionRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
  };

  const closeModal = () => {
    if (modalType === 'success') {
      // For success modal, reload page to invalidate token
      window.location.reload();
    } else {
      // For error modal, just close
      setShowModal(false);
    }
  };

  const retrySubmit = () => {
    setShowModal(false);
    setShowValidation(false);
    setFormErrors({});
  };

  useEffect(() => {
    // Initialize Material Kit inputs after component mounts
    const initializeMaterialInputs = () => {
      const inputs = document.querySelectorAll('.input-group-dynamic .form-control');
      
      inputs.forEach((input) => {
        const inputElement = input as HTMLInputElement | HTMLTextAreaElement;
        const inputGroup = inputElement.closest('.input-group-dynamic');
        
        if (inputGroup) {
          const handleFocus = () => {
            inputGroup.classList.add('is-focused');
            if (inputElement.value !== '') {
              inputGroup.classList.add('is-filled');
            }
          };
          
          const handleBlur = () => {
            inputGroup.classList.remove('is-focused');
            if (inputElement.value === '') {
              inputGroup.classList.remove('is-filled');
            }
          };
          
          const handleInput = () => {
            if (inputElement.value !== '') {
              inputGroup.classList.add('is-filled');
            } else {
              inputGroup.classList.remove('is-filled');
            }
          };
          
          // Remove existing listeners to prevent duplicates
          inputElement.removeEventListener('focus', handleFocus);
          inputElement.removeEventListener('blur', handleBlur);
          inputElement.removeEventListener('input', handleInput);
          
          // Add the event listeners
          inputElement.addEventListener('focus', handleFocus);
          inputElement.addEventListener('blur', handleBlur);
          inputElement.addEventListener('input', handleInput);
          
          // Initialize state based on current value
          if (inputElement.value !== '') {
            inputGroup.classList.add('is-filled');
          }
        }
      });
    };

    initializeMaterialInputs();
    const timer = setTimeout(initializeMaterialInputs, 100);

    // Initialize Bootstrap tooltips if Bootstrap is available
    try {
      const maybeBootstrap: unknown = (window as unknown as { bootstrap?: unknown }).bootstrap;
      const bs = maybeBootstrap as { Tooltip?: new (element: Element) => unknown } | undefined;
      if (bs && bs.Tooltip && typeof bs.Tooltip === 'function') {
        const tooltipTriggerList = Array.from(document.querySelectorAll('[data-bs-toggle="tooltip"]')) as HTMLElement[];
        tooltipTriggerList.forEach(el => { new bs.Tooltip!(el); });
      }
    } catch {
      // ignore if bootstrap is not present
    }
    
    return () => clearTimeout(timer);
  }, [form.proponents.length, form.hasGuarantors]);

  // Allow only numbers with up to 2 decimal places
  const sanitizeMoneyInput = (raw: string): string => {
    if (raw === '') return '';
    let s = raw.replace(/,/g, '.');
    // Keep digits and dots only
    s = s.replace(/[^0-9.]/g, '');
    // If starts with dot, prefix a zero
    if (s.startsWith('.')) s = '0' + s;
    // Collapse multiple dots into one (keep the first)
    const firstDot = s.indexOf('.');
    if (firstDot !== -1) {
      const intPart = s.slice(0, firstDot);
      const decPart = s.slice(firstDot + 1).replace(/\./g, '');
      s = intPart + '.' + decPart.slice(0, 2);
    }
    return s;
  };

  const handleTopLevelChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const moneyFields = new Set(['purchaseValue','financingAmount','otherFinancingAmount','ownCapital']);
    const nextValue = (moneyFields.has(name)) ? sanitizeMoneyInput(value) : value;
    setForm(prev => ({ ...prev, [name]: nextValue }));
    
    // Trigger input event for Material Kit animation
    const inputGroup = e.target.closest('.input-group-dynamic');
    if (inputGroup) {
      if (nextValue !== '') {
        inputGroup.classList.add('is-filled');
      } else {
        inputGroup.classList.remove('is-filled');
      }
    }
  };

  const handlePersonChange = (
    section: 'guarantors' | 'proponents',
    index: number,
    field: keyof Person,
    value: string,
    event?: MinimalEvent | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm(prev => {
      const copy = { ...prev } as FormState;
      const arr = [...copy[section]];
      arr[index] = { ...arr[index], [field]: value } as Person;
      copy[section] = arr;
      return copy;
    });

    // Handle Material Kit animation for the input that changed
    if (event) {
      let inputGroup: Element | null = null;
      // Narrow for React.ChangeEvent
      if (typeof (event as React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>).target !== 'undefined') {
        const tgt = (event as React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>).target;
        if (typeof tgt.closest === 'function') {
          inputGroup = tgt.closest('.input-group-dynamic');
        }
      } else if (typeof (event as MinimalEvent).target?.closest === 'function') {
        // Fallback for MinimalEvent from DatePicker
        inputGroup = (event as MinimalEvent).target.closest('.input-group-dynamic');
      }
      if (inputGroup) {
        if (value !== '') {
          (inputGroup as HTMLElement).classList.add('is-filled');
        } else {
          (inputGroup as HTMLElement).classList.remove('is-filled');
        }
      }
    }
  };

  const handleGuarantorsToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hasGuarantors = e.target.checked;
    setForm(prev => ({
      ...prev,
      hasGuarantors,
      guarantors: hasGuarantors ? [emptyPerson()] : []
    }));
  };

  const addPerson = (section: 'guarantors' | 'proponents') => {
    setForm(prev => ({ ...prev, [section]: [...prev[section], emptyPerson()] }));
  };

  const removePerson = (section: 'guarantors' | 'proponents', index: number) => {
    setForm(prev => {
      const arr = prev[section].slice();
      arr.splice(index, 1);
      return { ...prev, [section]: arr };
    });
  };

  const toNumberOrNull = (v: string): number | null => {
    if (v === undefined || v === null) return null;
    const trimmed = String(v).trim();
    if (trimmed === '') return null;
    const n = Number(trimmed.replace(/,/g, ''));
    return isNaN(n) ? null : n;
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowValidation(true);
    
    if (!validateForm()) {
      return;
    }
    
  const payload = {
      consultant: form.consultant || '',
      purchaseValue: toNumberOrNull(form.purchaseValue) ?? 0,
      financingAmount: toNumberOrNull(form.financingAmount) ?? 0,
      otherFinancingAmount: toNumberOrNull(form.otherFinancingAmount),
      ownCapital: toNumberOrNull(form.ownCapital) ?? 0,
      comments: form.comments || '',
      rents: form.rents || '',
      guarantors: form.guarantors.map(g => ({
        name: g.name,
        dateOfBirth: g.dateOfBirth,
        responsibilities: g.responsibilities,
        incomes: g.incomes,
        maritalStatus: g.maritalStatus,
        employmentStatus: g.employmentStatus,
        dependents: g.dependents,
      })),
      proponents: form.proponents.map(p => ({ ...p })),
      hasGuarantors: form.hasGuarantors,
      request_id: documentation?.request_id,
      customerId: customerId,
    };
    // Submit to backend
    const submit = async () => {
      setIsSubmitting(true);
      try {
        const reqId = documentation?.request_id || '';
        const base = import.meta.env.VITE_DOCUMENTATION_HOST || '';
        const url = `${base}/mortgage-application/customers/submit?request_id=${encodeURIComponent(reqId)}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ application_form: payload }),
        });
        const text = await res.text();
        let data: unknown = null;
        try {
          data = text ? JSON.parse(text) : null;
        } catch {
          // ignore JSON parse error, fall back to text
        }
        const hasErrorKey = (v: unknown): v is { error: string } => !!v && typeof v === 'object' && 'error' in v;
        if (!res.ok) {
          const errMsg = hasErrorKey(data) ? data.error : `Submit failed (${res.status})`;
          throw new Error(errMsg);
        }
        setModalType('success');
        setShowModal(true);
        // After showing success modal briefly, reload page to invalidate token
        setTimeout(() => {
          window.location.reload();
        }, 10000); // Show success modal for 2 seconds before reload
      } catch (err) {
        console.error('Submit error', err);
        setModalType('error');
        setShowModal(true);
      } finally {
        setIsSubmitting(false);
      }
    };
    submit();
  };

  // Always render the page, but conditionally show application section
  const selLangRaw = documentation?.lang || navigator.language;
  const lang: keyof MortgageTranslations = selLangRaw && selLangRaw.toLowerCase().startsWith('pt') ? 'pt' : 'en';
  const t = mortgageTranslations[lang];

  return (
    <div className="bg-gray-200">
      <header>
        <div
          className="page-header min-vh-50 mortgage-header"
          style={{
            backgroundColor: '#f8f9fa',
            position: 'relative',
          }}
        >
          <div className="container" style={{ position: 'relative', zIndex: 2 }}>
            <div className="row align-items-stretch h-100">
              <div className="col-lg-7 col-md-7 d-flex justify-content-center flex-column">
                <div className="mb-3">
                  <span className="badge bg-gradient-dark text-white px-3 py-2" style={{ borderRadius: '2rem', fontSize: '0.875rem' }}>
                    {t.hero.badge}
                  </span>
                </div>
                <h1 className="text-dark font-weight-bolder mb-4" style={{ fontSize: '3.5rem' }}>{t.hero.title}</h1>
                <p className="text-muted lead pe-5 me-5 mb-5">{t.hero.subtitle}</p>
                <div className="buttons">
                  {token && documentation && (
                    <button type="button" className="btn bg-gradient-dark btn-lg me-3" style={{ borderRadius: '0.75rem' }} onClick={scrollToApplication}>{t.hero.getStarted}</button>
                  )}
                  <a href="https://www.lvf.pt" target="_blank" rel="noopener noreferrer" className="btn btn-outline-dark btn-lg" style={{ borderRadius: '0.75rem' }}>{t.hero.learnMore}</a>
                </div>
              </div>
              <div className="col-lg-5 col-md-5 d-flex align-items-center justify-content-center h-100 text-center">
                <img
                  src="/lvf_blackfont_logo.png"
                  alt="LVF Logo"
                  className="img-fluid"
                  style={{
                    height: '100%',
                    maxHeight: '100%',
                    width: 'auto',
                    maxWidth: '100%',
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Trusted By Section */}
      <section className="py-5" style={{ backgroundColor: '#ffffff' }}>
        <div className="container">
          <div className="row">
            <div className="col-lg-6 mx-auto text-center">
              <h4 className="text-muted mb-1">{t.trustedBy.heading1}</h4>
              <h2 className="text-dark font-weight-bold mb-3">{t.trustedBy.heading2}</h2>
              <p className="lead text-muted mb-5">{t.trustedBy.desc}</p>
            </div>
          </div>
          
          <div className="row">
            <div className="col-lg-8 mx-auto">
              <div className="row text-center">
                <div className="col-md-4 col-6 mb-4">
                  <div className="p-3">
                    <h3 className="text-gradient text-primary font-weight-bold mb-0">15K+</h3>
                    <p className="text-sm text-muted mb-0">{t.trustedBy.appsProcessed}</p>
                  </div>
                </div>
                <div className="col-md-4 col-6 mb-4">
                  <div className="p-3">
                    <h3 className="text-gradient text-primary font-weight-bold mb-0">98%</h3>
                    <p className="text-sm text-muted mb-0">{t.trustedBy.approvalRate}</p>
                  </div>
                </div>
                <div className="col-md-4 col-6 mb-4">
                  <div className="p-3">
                    <h3 className="text-gradient text-primary font-weight-bold mb-0">24h</h3>
                    <p className="text-sm text-muted mb-0">{t.trustedBy.avgProcessing}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Only show application section if token exists AND documentation was successfully loaded */}
      {token && documentation && (
        <section className="py-7" style={{ backgroundColor: '#f8f9fa' }} ref={applicationSectionRef}>
          <div className="container">
            <div className="row">
              <div className="col-lg-8 mx-auto">
                <div className="text-center mb-6">
                  <h2 className="text-dark font-weight-bold mb-3">{t.hero.title}</h2>
                  <p className="lead text-muted">{t.hero.subtitle}</p>
                </div>
                
                <div className="card shadow-lg border-0" style={{ borderRadius: '1rem' }}>
                  <div className="card-header bg-gradient-dark text-white text-center" style={{ borderRadius: '1rem 1rem 0 0', padding: '1.5rem', color: 'white' }}>
                    <h4 className="mb-0 text-white font-weight-bold" style={{ color: 'white' }}>Mortgage Application Details</h4>
                  </div>
                  
                  <form role="form" id="mortgage-form" method="post" autoComplete="off" onSubmit={onSubmit} ref={formRef}>
                    <div className="card-body p-5">
                      {/* Basic Information Section */}
                      <div className="row mb-5">
                        <div className="col-12">
                          <h5 className="font-weight-bold text-dark mb-4">
                            <i className="material-icons text-dark me-2">person</i>
                            {t.form.sectionBasic}
                          </h5>
                        </div>
                        <div className="col-md-6">
                          <div className={`input-group input-group-dynamic mb-4 ${form.consultant ? 'is-filled' : ''}`}>
                            <label className="form-label">{t.form.consultant}</label>
                            <input
                              className={`form-control ${getValidationClass('consultant')}`}
                              name="consultant"
                              value={form.consultant}
                              onChange={handleTopLevelChange}
                              aria-label="Consultant..."
                              type="text"
                              data-bs-toggle="tooltip"
                              data-bs-placement="top"
                              title={t.form.consultantTooltip}
                            />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className={`input-group input-group-dynamic mb-4 ${form.rents ? 'is-filled' : ''}`}>
                            <label className="form-label">{t.form.rents}</label>
                            <input className={`form-control ${getValidationClass('rents')}`} name="rents" value={form.rents} onChange={handleTopLevelChange} aria-label="Rents..." type="text" />
                          </div>
                        </div>
                      </div>

                      {/* Financial Details Section */}
                      <div className="row mb-5">
                        <div className="col-12">
                          <h5 className="font-weight-bold text-dark mb-4">
                            <i className="material-icons text-dark me-2">account_balance</i>
                            {t.form.sectionFinancial}
                          </h5>
                          {showValidation && !form.financingAmount?.trim() && !form.otherFinancingAmount?.trim() }
                        </div>
                        <div className="col-md-4">
                          <div className={`input-group input-group-dynamic mb-4 ${form.purchaseValue ? 'is-filled' : ''}`}>
                            <label className="form-label">{t.form.purchaseValue} *</label>
                            <input className={`form-control ${getValidationClass('purchaseValue')}`} name="purchaseValue" value={form.purchaseValue} onChange={handleTopLevelChange} aria-label="Purchase Value..." type="text" inputMode="decimal" />
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className={`input-group input-group-dynamic mb-4 ${form.financingAmount ? 'is-filled' : ''}`}>
                            <label className="form-label">{t.form.financingAmount} *</label>
                            <input className={`form-control ${getValidationClass('financingAmount')}`} name="financingAmount" value={form.financingAmount} onChange={handleTopLevelChange} aria-label="Financing Amount..." type="text" inputMode="decimal" />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className={`input-group input-group-dynamic mb-4 ${form.otherFinancingAmount ? 'is-filled' : ''}`}>
                            <label className="form-label">{t.form.otherFinancingAmount} *</label>
                            <input className={`form-control ${getValidationClass('otherFinancingAmount')}`} name="otherFinancingAmount" value={form.otherFinancingAmount} onChange={handleTopLevelChange} aria-label="Other Financing Amount..." type="text" inputMode="decimal" />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className={`input-group input-group-dynamic mb-4 ${form.ownCapital ? 'is-filled' : ''}`}>
                            <label className="form-label">{t.form.ownCapital}</label>
                            <input className={`form-control ${getValidationClass('ownCapital')}`} name="ownCapital" value={form.ownCapital} onChange={handleTopLevelChange} aria-label="Own Capital..." type="text" inputMode="decimal" />
                          </div>
                        </div>
                      </div>

                      {/* Comments Section */}
                      <div className="row mb-5">
                        <div className="col-12">
                          <h5 className="font-weight-bold text-dark mb-4">
                            <i className="material-icons text-dark me-2">comment</i>
                            {t.form.comments}
                          </h5>
                          <div className={`input-group input-group-dynamic ${form.comments ? 'is-filled' : ''}`}>
                            <label className="form-label">{t.form.comments}</label>
                            <textarea className={`form-control ${getValidationClass('comments')}`} name="comments" rows={4} value={form.comments} onChange={handleTopLevelChange} />
                          </div>
                        </div>
                      </div>

                      {/* Proponents Section */}
                      <div className="row mb-5">
                        <div className="col-12">
                          <h5 className="font-weight-bold text-dark mb-4">
                            <i className="material-icons text-dark me-2">group</i>
                            {t.form.proponents}
                          </h5>
                          {form.proponents.map((p, idx) => (
                            <ProponentCard
                              key={`proponent-${idx}`}
                              index={idx}
                              person={p}
                              getValidationClass={getValidationClass}
                              onChange={(field, value, event) => handlePersonChange('proponents', idx, field, value, event)}
                              onRemove={form.proponents.length > 1 ? () => removePerson('proponents', idx) : undefined}
                              showRemove={form.proponents.length > 1}
                              lang={lang}
                            />
                          ))}
                          <button type="button" className="btn bg-gradient-dark w-100 mb-4" onClick={() => addPerson('proponents')} style={{ borderRadius: '0.75rem', padding: '12px' }}>
                            <i className="material-icons me-2" style={{ verticalAlign: 'middle', fontSize: '18px' }}>add</i>
                            {t.form.addProponent}
                          </button>
                        </div>
                      </div>

                      {/* Guarantors Checkbox and Section */}
                      <div className="row mb-5">
                        <div className="col-12">
                          <div className="form-check form-switch mb-4 d-flex align-items-center">
                            <input 
                              className="form-check-input" 
                              type="checkbox" 
                              id="hasGuarantors" 
                              checked={form.hasGuarantors}
                              onChange={handleGuarantorsToggle}
                            />
                            <label className="form-check-label ms-3 mb-0 font-weight-bold text-dark" htmlFor="hasGuarantors">
                              <i className="material-icons text-sm me-2" style={{ verticalAlign: 'middle', fontSize: '16px' }}>verified_user</i>
                              {t.form.guarantorsToggle}
                            </label>
                          </div>

                          {/* Guarantors Section - Only show if checkbox is checked */}
                          {form.hasGuarantors && (
                            <div className="mt-4">
                              <h5 className="font-weight-bold text-dark mb-4">
                                <i className="material-icons text-dark me-2" style={{ verticalAlign: 'middle', fontSize: '20px' }}>shield</i>
                                {t.form.guarantors}
                              </h5>
                              {form.guarantors.map((g, idx) => (
                                <GuarantorCard
                                  key={`guarantor-${idx}`}
                                  index={idx}
                                  person={g}
                                  getValidationClass={getValidationClass}
                                  onChange={(field, value, event) => handlePersonChange('guarantors', idx, field, value, event)}
                                  onRemove={form.guarantors.length > 1 ? () => removePerson('guarantors', idx) : undefined}
                                  showRemove={form.guarantors.length > 1}
                                  lang={lang}
                                />
                              ))}
                              <button type="button" className="btn bg-gradient-warning w-100 mb-4" onClick={() => addPerson('guarantors')} style={{ borderRadius: '0.75rem', padding: '12px' }}>
                                <i className="material-icons me-2" style={{ verticalAlign: 'middle', fontSize: '18px' }}>add</i>
                                {t.form.addGuarantor}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Terms and Submit */}
                      <div className="row">
                        <div className="col-12">
                          <div className="form-check form-switch mb-4 d-flex align-items-center">
                            <input className="form-check-input" type="checkbox" id="flexSwitchCheckDefault" defaultChecked />
                            <label className="form-check-label ms-3 mb-0" htmlFor="flexSwitchCheckDefault">
                              I agree to the <a href="#" className="text-dark font-weight-bold" onClick={e => e.preventDefault()}><u>Terms and Conditions</u></a>.
                            </label>
                          </div>
                        </div>
                        <div className="col-12">
                          <button type="submit" className="btn bg-gradient-dark w-100 btn-lg" style={{ borderRadius: '0.75rem', padding: '15px' }} disabled={isSubmitting}>
                            {isSubmitting ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Submitting...
                              </>
                            ) : (
                              <>
                                <i className="material-icons me-2" style={{ verticalAlign: 'middle', fontSize: '20px' }}>send</i>
                                {t.form.submit}
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>

                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Modal for Success/Error Feedback */}
      {showModal && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: '1rem', border: 'none' }}>
              <div className={`modal-header ${modalType === 'success' ? 'bg-gradient-success' : 'bg-gradient-danger'} text-white`} style={{ borderRadius: '1rem 1rem 0 0' }}>
                <h4 className="modal-title text-white font-weight-bold">
                  <i className={`material-icons me-2 ${modalType === 'success' ? 'text-success' : 'text-danger'}`} style={{ color: 'white !important' }}>
                    {modalType === 'success' ? 'check_circle' : 'error'}
                  </i>
                  {modalType === 'success' ? t.modal.success.title : t.modal.error.title}
                </h4>
                <button type="button" className="btn-close btn-close-white" onClick={closeModal} aria-label="Close"></button>
              </div>
              <div className="modal-body p-4">
                <p className="mb-0 text-muted lead">
                  {modalType === 'success' ? t.modal.success.message : t.modal.error.message}
                </p>
              </div>
              <div className="modal-footer border-0 pt-0">
                {modalType === 'error' && (
                  <button type="button" className="btn bg-gradient-primary me-2" onClick={retrySubmit}>
                    {t.modal.error.retryButton}
                  </button>
                )}
                <button type="button" className="btn btn-outline-secondary" onClick={closeModal}>
                  {modalType === 'success' ? t.modal.success.closeButton : t.modal.error.closeButton}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default MortageApplication;
