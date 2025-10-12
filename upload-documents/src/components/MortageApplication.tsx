import React, { useState, useEffect, useRef } from 'react';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';

// DatePicker Component using Flatpickr
interface DatePickerProps {
  value: string;
  onChange: (value: string, event?: any) => void;
  placeholder?: string;
  className?: string;
  isFilled?: boolean;
}

const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, placeholder = "Date of Birth", className = "", isFilled = false }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const flatpickrRef = useRef<flatpickr.Instance | null>(null);

  useEffect(() => {
    if (inputRef.current && !flatpickrRef.current) {
      flatpickrRef.current = flatpickr(inputRef.current, {
        dateFormat: "Y-m-d",
        allowInput: true,
        onChange: (selectedDates, dateStr) => {
          // Create a synthetic event to pass to handlePersonChange
          const syntheticEvent = {
            target: {
              closest: () => null // Since this is input-group-static, we don't need Material Kit animation
            }
          };
          onChange(dateStr, syntheticEvent);
        }
      });
    }

    // Set initial value if provided
    if (flatpickrRef.current && value) {
      flatpickrRef.current.setDate(value);
    }

    return () => {
      if (flatpickrRef.current) {
        flatpickrRef.current.destroy();
        flatpickrRef.current = null;
      }
    };
  }, []);

  // Update flatpickr when value changes externally
  useEffect(() => {
    if (flatpickrRef.current && value !== flatpickrRef.current.input.value) {
      flatpickrRef.current.setDate(value || "");
    }
  }, [value]);

  return (
    <div className="row py-3">
      <div className="col-md-12 mx-auto">
        <div className="row">
          <div className="col-lg-12 mx-auto">
            <div className="input-group input-group-static mb-4">
              <span className="input-group-text">
                <i className="material-icons">calendar_today</i>
              </span>
              <input
                ref={inputRef}
                className={`form-control datepicker ${className}`}
                placeholder={placeholder}
                type="text"
                value={value}
                readOnly
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Types
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
  appraisalValue: string;
  financingAmount: string;
  otherFinancingAmount: string; // allow empty -> null on submit
  ownCapital: string;
  comments: string;
  rents: string;
  guarantor: Person[];
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
  maritalStatus: 'single',
  employmentStatus: 'employed_full_time',
  dependents: '0',
});

const MortageApplication: React.FC = () => {
  const [form, setForm] = useState<FormState>({
    consultant: '',
    purchaseValue: '',
    appraisalValue: '',
    financingAmount: '',
    otherFinancingAmount: '',
    ownCapital: '',
    comments: '',
    rents: '',
    guarantor: [],
    proponents: [emptyPerson()],
    hasGuarantors: false,
  });

  const [submitted, setSubmitted] = useState<any | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const applicationSectionRef = useRef<HTMLElement>(null);

  const scrollToApplication = () => {
    applicationSectionRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
  };

  useEffect(() => {
    // Initialize Material Kit inputs after component mounts
    const initializeMaterialInputs = () => {
      const inputs = document.querySelectorAll('.input-group-dynamic .form-control');
      
      inputs.forEach((input) => {
        const inputElement = input as HTMLInputElement | HTMLTextAreaElement;
        const inputGroup = inputElement.closest('.input-group-dynamic');
        
        if (inputGroup) {
          // Add event listeners for focus, blur, and input
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

    // Initialize immediately and also with a small delay
    initializeMaterialInputs();
    const timer = setTimeout(initializeMaterialInputs, 100);
    
    return () => clearTimeout(timer);
  }, [form.proponents.length, form.hasGuarantors]); // Re-run when proponents or guarantors change

  const handleTopLevelChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    console.log('handleTopLevelChange:', { name, value }); // Debug log
    setForm(prev => ({ ...prev, [name]: value }));
    
    // Trigger input event for Material Kit animation
    const inputGroup = e.target.closest('.input-group-dynamic');
    if (inputGroup) {
      if (value !== '') {
        inputGroup.classList.add('is-filled');
      } else {
        inputGroup.classList.remove('is-filled');
      }
    }
  };

  const handlePersonChange = (
    section: 'guarantor' | 'proponents',
    index: number,
    field: keyof Person,
    value: string,
    event?: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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
      const inputGroup = event.target.closest('.input-group-dynamic');
      if (inputGroup) {
        if (value !== '') {
          inputGroup.classList.add('is-filled');
        } else {
          inputGroup.classList.remove('is-filled');
        }
      }
    }
  };

  const handleGuarantorsToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hasGuarantors = e.target.checked;
    setForm(prev => ({
      ...prev,
      hasGuarantors,
      guarantor: hasGuarantors ? [emptyPerson()] : [] // Add one guarantor when enabled, clear when disabled
    }));
  };

  const addPerson = (section: 'guarantor' | 'proponents') => {
    setForm(prev => ({ ...prev, [section]: [...prev[section], emptyPerson()] }));
  };

  const removePerson = (section: 'guarantor' | 'proponents', index: number) => {
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
    const payload = {
      consultant: form.consultant || '',
      purchaseValue: toNumberOrNull(form.purchaseValue) ?? 0,
      appraisalValue: toNumberOrNull(form.appraisalValue) ?? 0,
      financingAmount: toNumberOrNull(form.financingAmount) ?? 0,
      otherFinancingAmount: toNumberOrNull(form.otherFinancingAmount),
      ownCapital: toNumberOrNull(form.ownCapital) ?? 0,
      comments: form.comments || '',
      rents: form.rents || '',
      guarantor: form.guarantor.map(g => ({ ...g })),
      proponents: form.proponents.map(p => ({ ...p })),
    };
    setSubmitted(payload);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-gray-200">
      <header>
        <div
          className="page-header min-vh-60"
          style={{
            backgroundColor: '#f8f9fa',
            position: 'relative',
            paddingTop: '6rem',
            paddingBottom: '4rem',
          }}
        >
          <div className="container" style={{ position: 'relative', zIndex: 2 }}>
            <div className="row align-items-center h-100">
              <div className="col-lg-7 col-md-7 d-flex justify-content-center flex-column">
                <div className="mb-3">
                  <span className="badge bg-gradient-dark text-white px-3 py-2" style={{ borderRadius: '2rem', fontSize: '0.875rem' }}>
                    LVF - Luis Miguel Filipe, Lda
                  </span>
                </div>
                <h1 className="text-dark font-weight-bolder mb-4" style={{ fontSize: '3.5rem' }}>Mortgage Application</h1>
                <p className="text-muted lead pe-5 me-5 mb-5">
                  Complete your mortgage application with LVF's streamlined process. Secure, fast, and designed with your needs in mind by trusted financial experts.
                </p>
                <div className="buttons">
                  <button type="button" className="btn bg-gradient-dark btn-lg me-3" style={{ borderRadius: '0.75rem' }} onClick={scrollToApplication}>Get Started</button>
                  <a href="https://www.lvf.pt" target="_blank" rel="noopener noreferrer" className="btn btn-outline-dark btn-lg" style={{ borderRadius: '0.75rem' }}>Learn More</a>
                </div>
              </div>
              <div className="col-lg-5 col-md-5 text-center">
                <img 
                  src="/lvf_requestdocumentation.png" 
                  alt="LVF Logo" 
                  className="img-fluid"
                  style={{ 
                    maxHeight: '200px',
                    width: 'auto',
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
              <h4 className="text-muted mb-1">Trusted by over</h4>
              <h2 className="text-dark font-weight-bold mb-3">15,000+ customers</h2>
              <p className="lead text-muted mb-5">
                Many banks, financial institutions, and mortgage brokers trust our platform for secure and efficient loan processing.
              </p>
            </div>
          </div>
          
          <div className="row">
            <div className="col-lg-8 mx-auto">
              <div className="row text-center">
                <div className="col-md-4 col-6 mb-4">
                  <div className="p-3">
                    <h3 className="text-gradient text-primary font-weight-bold mb-0">15K+</h3>
                    <p className="text-sm text-muted mb-0">Applications Processed</p>
                  </div>
                </div>
                <div className="col-md-4 col-6 mb-4">
                  <div className="p-3">
                    <h3 className="text-gradient text-primary font-weight-bold mb-0">98%</h3>
                    <p className="text-sm text-muted mb-0">Approval Rate</p>
                  </div>
                </div>
                <div className="col-md-4 col-6 mb-4">
                  <div className="p-3">
                    <h3 className="text-gradient text-primary font-weight-bold mb-0">24h</h3>
                    <p className="text-sm text-muted mb-0">Average Processing</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          

        </div>
      </section>
      
      <section className="py-7" style={{ backgroundColor: '#f8f9fa' }} ref={applicationSectionRef}>
        <div className="container">
          <div className="row">
            <div className="col-lg-8 mx-auto">
              <div className="text-center mb-6">
                <h2 className="text-dark font-weight-bold mb-3">Application Form</h2>
                <p className="lead text-muted">Please fill out all required information below</p>
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
                          Basic Information
                        </h5>
                      </div>
                      <div className="col-md-6">
                        <div className={`input-group input-group-dynamic mb-4 ${form.consultant ? 'is-filled' : ''}`}>
                          <label className="form-label">Consultant</label>
                          <input className="form-control" name="consultant" value={form.consultant} onChange={handleTopLevelChange} aria-label="Consultant..." type="text" />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className={`input-group input-group-dynamic mb-4 ${form.rents ? 'is-filled' : ''}`}>
                          <label className="form-label">Rents</label>
                          <input className="form-control" name="rents" value={form.rents} onChange={handleTopLevelChange} aria-label="Rents..." type="text" />
                        </div>
                      </div>
                    </div>

                    {/* Financial Details Section */}
                    <div className="row mb-5">
                      <div className="col-12">
                        <h5 className="font-weight-bold text-dark mb-4">
                          <i className="material-icons text-dark me-2">account_balance</i>
                          Financial Details
                        </h5>
                      </div>
                      <div className="col-md-4">
                        <div className={`input-group input-group-dynamic mb-4 ${form.purchaseValue ? 'is-filled' : ''}`}>
                          <label className="form-label">Purchase Value</label>
                          <input className="form-control" name="purchaseValue" value={form.purchaseValue} onChange={handleTopLevelChange} aria-label="Purchase Value..." type="text" />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className={`input-group input-group-dynamic mb-4 ${form.appraisalValue ? 'is-filled' : ''}`}>
                          <label className="form-label">Appraisal Value</label>
                          <input className="form-control" name="appraisalValue" value={form.appraisalValue} onChange={handleTopLevelChange} aria-label="Appraisal Value..." type="text" />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className={`input-group input-group-dynamic mb-4 ${form.financingAmount ? 'is-filled' : ''}`}>
                          <label className="form-label">Financing Amount</label>
                          <input className="form-control" name="financingAmount" value={form.financingAmount} onChange={handleTopLevelChange} aria-label="Financing Amount..." type="text" />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className={`input-group input-group-dynamic mb-4 ${form.otherFinancingAmount ? 'is-filled' : ''}`}>
                          <label className="form-label">Other Financing Amount</label>
                          <input className="form-control" name="otherFinancingAmount" value={form.otherFinancingAmount} onChange={handleTopLevelChange} aria-label="Other Financing Amount..." type="text" />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className={`input-group input-group-dynamic mb-4 ${form.ownCapital ? 'is-filled' : ''}`}>
                          <label className="form-label">Own Capital</label>
                          <input className="form-control" name="ownCapital" value={form.ownCapital} onChange={handleTopLevelChange} aria-label="Own Capital..." type="text" />
                        </div>
                      </div>
                    </div>

                    {/* Comments Section */}
                    <div className="row mb-5">
                      <div className="col-12">
                        <h5 className="font-weight-bold text-dark mb-4">
                          <i className="material-icons text-dark me-2">comment</i>
                          Additional Comments
                        </h5>
                        <div className={`input-group input-group-dynamic ${form.comments ? 'is-filled' : ''}`}>
                          <label className="form-label">Comments</label>
                          <textarea className="form-control" name="comments" rows={4} value={form.comments} onChange={handleTopLevelChange} />
                        </div>
                      </div>
                    </div>

                    {/* Proponents Section */}
                    <div className="row mb-5">
                      <div className="col-12">
                        <h5 className="font-weight-bold text-dark mb-4">
                          <i className="material-icons text-dark me-2">group</i>
                          Proponents
                        </h5>
                        {form.proponents.map((p, idx) => (
                          <div key={`proponent-${idx}`} className="card card-plain border mb-4" style={{ borderRadius: '0.75rem', backgroundColor: '#f8f9fa' }}>
                            <div className="card-body p-4">
                              <div className="d-flex justify-content-between align-items-center mb-3">
                                <h6 className="font-weight-bold text-dark mb-0">Proponent {idx + 1}</h6>
                                {form.proponents.length > 1 && (
                                  <button type="button" className="btn btn-outline-dark btn-sm" onClick={() => removePerson('proponents', idx)} style={{ borderRadius: '0.5rem' }}>
                                    <i className="material-icons" style={{ fontSize: '16px' }}>delete</i>
                                    Remove
                                  </button>
                                )}
                              </div>
                              
                              {/* Basic Information Row */}
                              <div className="row">
                                <div className="col-md-4">
                                  <div className={`input-group input-group-dynamic mb-4 ${p.name ? 'is-filled' : ''}`}>
                                    <label className="form-label">Full Name</label>
                                    <input 
                                      className="form-control" 
                                      value={p.name} 
                                      onChange={e => handlePersonChange('proponents', idx, 'name', e.target.value, e)} 
                                      aria-label="Name..." 
                                      type="text" 
                                    />
                                  </div>
                                </div>
                                <div className="col-md-4">
                                  <div className={`input-group input-group-dynamic mb-4 ${p.phoneNumber ? 'is-filled' : ''}`}>
                                    <label className="form-label">Phone Number</label>
                                    <input 
                                      className="form-control" 
                                      value={p.phoneNumber} 
                                      onChange={e => handlePersonChange('proponents', idx, 'phoneNumber', e.target.value, e)} 
                                      aria-label="Phone..." 
                                      type="text" 
                                    />
                                  </div>
                                </div>
                                <div className="col-md-4">
                                  <div className={`input-group input-group-dynamic mb-4 ${p.email ? 'is-filled' : ''}`}>
                                    <label className="form-label">Email</label>
                                    <input 
                                      className="form-control" 
                                      value={p.email} 
                                      onChange={e => handlePersonChange('proponents', idx, 'email', e.target.value, e)} 
                                      aria-label="Email..." 
                                      type="email" 
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Personal Details Row */}
                              <div className="row">
                                <div className="col-md-4">
                                  <DatePicker
                                    value={p.dateOfBirth}
                                    onChange={(value, event) => handlePersonChange('proponents', idx, 'dateOfBirth', value, event)}
                                    isFilled={!!p.dateOfBirth}
                                  />
                                </div>
                                <div className="col-md-4">
                                  <div className="mb-4">
                                    <label className="form-label text-dark font-weight-bold mb-2">Marital Status</label>
                                    <select 
                                      className="form-select" 
                                      value={p.maritalStatus} 
                                      onChange={e => handlePersonChange('proponents', idx, 'maritalStatus', e.target.value, e)}
                                      style={{ borderRadius: '0.5rem', border: '1px solid #d2d6da', padding: '0.75rem' }}
                                    >
                                      <option value="single">Single</option>
                                      <option value="married">Married</option>
                                      <option value="divorced">Divorced</option>
                                      <option value="widowed">Widowed</option>
                                      <option value="separated">Separated</option>
                                    </select>
                                  </div>
                                </div>
                                <div className="col-md-4">
                                  <div className="mb-4">
                                    <label className="form-label text-dark mb-2">Employment Status</label>
                                    <select 
                                      className="form-select" 
                                      value={p.employmentStatus} 
                                      onChange={e => handlePersonChange('proponents', idx, 'employmentStatus', e.target.value, e)}
                                      style={{ borderRadius: '0.5rem', border: '1px solid #d2d6da', padding: '0.75rem' }}
                                    >
                                      <option value="employed_full_time">Employed Full-Time</option>
                                      <option value="employed_part_time">Employed Part-Time</option>
                                      <option value="self_employed">Self-Employed</option>
                                      <option value="unemployed">Unemployed</option>
                                      <option value="retired">Retired</option>
                                      <option value="student">Student</option>
                                    </select>
                                  </div>
                                </div>
                              </div>

                              {/* Financial Details Row */}
                              <div className="row">
                                <div className="col-md-4">
                                  <div className={`input-group input-group-dynamic mb-4 ${p.responsibilities ? 'is-filled' : ''}`}>
                                    <label className="form-label">Responsibilities</label>
                                    <input 
                                      className="form-control" 
                                      value={p.responsibilities} 
                                      onChange={e => handlePersonChange('proponents', idx, 'responsibilities', e.target.value, e)} 
                                      aria-label="Responsibilities..." 
                                      type="text" 
                                    />
                                  </div>
                                </div>
                                <div className="col-md-4">
                                  <div className={`input-group input-group-dynamic mb-4 ${p.incomes ? 'is-filled' : ''}`}>
                                    <label className="form-label">Incomes</label>
                                    <input 
                                      className="form-control" 
                                      value={p.incomes} 
                                      onChange={e => handlePersonChange('proponents', idx, 'incomes', e.target.value, e)} 
                                      aria-label="Incomes..." 
                                      type="text" 
                                    />
                                  </div>
                                </div>
                                <div className="col-md-4">
                                  <div className={`input-group input-group-dynamic mb-4 ${p.dependents ? 'is-filled' : ''}`}>
                                    <label className="form-label">Dependents</label>
                                    <input 
                                      className="form-control" 
                                      value={p.dependents} 
                                      onChange={e => {
                                        const value = e.target.value.replace(/[^0-9]/g, ''); // Only allow digits
                                        handlePersonChange('proponents', idx, 'dependents', value, e);
                                      }} 
                                      aria-label="Dependents..." 
                                      type="text" 
                                      inputMode="numeric"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        <button type="button" className="btn bg-gradient-dark w-100 mb-4" onClick={() => addPerson('proponents')} style={{ borderRadius: '0.75rem', padding: '12px' }}>
                          <i className="material-icons me-2">add</i>
                          Add Proponent
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
                            <i className="material-icons text-sm me-2">verified_user</i>
                            This mortgage application has guarantors
                          </label>
                        </div>

                        {/* Guarantors Section - Only show if checkbox is checked */}
                        {form.hasGuarantors && (
                          <div className="mt-4">
                            <h5 className="font-weight-bold text-dark mb-4">
                              <i className="material-icons text-dark me-2">shield</i>
                              Guarantors
                            </h5>
                            {form.guarantor.map((g, idx) => (
                              <div key={`guarantor-${idx}`} className="card card-plain border mb-4" style={{ borderRadius: '0.75rem', backgroundColor: '#fff3e0' }}>
                                <div className="card-body p-4">
                                  <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h6 className="font-weight-bold text-dark mb-0">Guarantor {idx + 1}</h6>
                                    {form.guarantor.length > 1 && (
                                      <button type="button" className="btn btn-outline-warning btn-sm" onClick={() => removePerson('guarantor', idx)} style={{ borderRadius: '0.5rem' }}>
                                        <i className="material-icons" style={{ fontSize: '16px' }}>delete</i>
                                        Remove
                                      </button>
                                    )}
                                  </div>
                                  
                                  {/* Basic Information Row */}
                                  <div className="row">
                                    <div className="col-md-4">
                                      <div className={`input-group input-group-dynamic mb-4 ${g.name ? 'is-filled' : ''}`}>
                                        <label className="form-label">Full Name</label>
                                        <input 
                                          className="form-control" 
                                          value={g.name} 
                                          onChange={e => handlePersonChange('guarantor', idx, 'name', e.target.value, e)} 
                                          aria-label="Name..." 
                                          type="text" 
                                        />
                                      </div>
                                    </div>
                                    <div className="col-md-4">
                                      <DatePicker
                                        value={g.dateOfBirth}
                                        onChange={(value, event) => handlePersonChange('guarantor', idx, 'dateOfBirth', value, event)}
                                        isFilled={!!g.dateOfBirth}
                                      />
                                    </div>
                                    <div className="col-md-4">
                                      <div className="mb-4">
                                        <label className="form-label text-dark mb-2">Marital Status</label>
                                        <select 
                                          className="form-select" 
                                          value={g.maritalStatus} 
                                          onChange={e => handlePersonChange('guarantor', idx, 'maritalStatus', e.target.value, e)}
                                          style={{ borderRadius: '0.5rem', border: '1px solid #d2d6da', padding: '0.75rem' }}
                                        >                                      
                                          <option value="single">Single</option>
                                          <option value="married">Married</option>
                                          <option value="divorced">Divorced</option>
                                          <option value="widowed">Widowed</option>
                                          <option value="separated">Separated</option>
                                        </select>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Employment and Financial Row */}
                                  <div className="row">
                                    <div className="col-md-3">
                                      <div className="mb-4">
                                        <label className="form-label text-dark mb-2">Employment Status</label>
                                        <select 
                                          className="form-select" 
                                          value={g.employmentStatus} 
                                          onChange={e => handlePersonChange('guarantor', idx, 'employmentStatus', e.target.value, e)}
                                          style={{ borderRadius: '0.5rem', border: '1px solid #d2d6da', padding: '0.75rem' }}
                                        >
                                          <option value="employed_full_time">Employed Full-Time</option>
                                          <option value="employed_part_time">Employed Part-Time</option>
                                          <option value="self_employed">Self-Employed</option>
                                          <option value="unemployed">Unemployed</option>
                                          <option value="retired">Retired</option>
                                          <option value="student">Student</option>
                                        </select>
                                      </div>
                                    </div>
                                    <div className="col-md-3">
                                      <div className={`input-group input-group-dynamic mb-4 ${g.responsibilities ? 'is-filled' : ''}`}>
                                        <label className="form-label">Responsibilities</label>
                                        <input 
                                          className="form-control" 
                                          value={g.responsibilities} 
                                          onChange={e => handlePersonChange('guarantor', idx, 'responsibilities', e.target.value, e)} 
                                          aria-label="Responsibilities..." 
                                          type="text" 
                                        />
                                      </div>
                                    </div>
                                    <div className="col-md-3">
                                      <div className={`input-group input-group-dynamic mb-4 ${g.incomes ? 'is-filled' : ''}`}>
                                        <label className="form-label">Incomes</label>
                                        <input 
                                          className="form-control" 
                                          value={g.incomes} 
                                          onChange={e => handlePersonChange('guarantor', idx, 'incomes', e.target.value, e)} 
                                          aria-label="Incomes..." 
                                          type="text" 
                                        />
                                      </div>
                                    </div>
                                    <div className="col-md-3">
                                      <div className={`input-group input-group-dynamic mb-4 ${g.dependents ? 'is-filled' : ''}`}>
                                        <label className="form-label">Dependents</label>
                                        <input 
                                          className="form-control" 
                                          value={g.dependents} 
                                          onChange={e => {
                                            const value = e.target.value.replace(/[^0-9]/g, ''); // Only allow digits
                                            handlePersonChange('guarantor', idx, 'dependents', value, e);
                                          }} 
                                          aria-label="Dependents..." 
                                          type="text" 
                                          inputMode="numeric"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                            <button type="button" className="btn bg-gradient-warning w-100 mb-4" onClick={() => addPerson('guarantor')} style={{ borderRadius: '0.75rem', padding: '12px' }}>
                              <i className="material-icons me-2">add</i>
                              Add Guarantor
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
                        <button type="submit" className="btn bg-gradient-dark w-100 btn-lg" style={{ borderRadius: '0.75rem', padding: '15px' }}>
                          <i className="material-icons me-2">send</i>
                          Submit Application
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
                
                {submitted && (
                  <div className="card mt-4 border-0 shadow" style={{ borderRadius: '1rem' }}>
                    <div className="card-header bg-gradient-dark text-white" style={{ borderRadius: '1rem 1rem 0 0', color: 'white' }}>
                      <h4 className="card-title mb-0 font-weight-bold" style={{ color: 'white' }}>
                        <i className="material-icons me-2" style={{ color: 'white' }}>check_circle</i>
                        Application Preview
                      </h4>
                    </div>
                    <div className="card-body p-4">
                      <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0, backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '0.5rem', fontSize: '14px' }}>{JSON.stringify(submitted, null, 2)}</pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default MortageApplication;
