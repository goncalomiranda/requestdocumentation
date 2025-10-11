import React, { useState, useEffect } from 'react';

// Types
interface Person {
  name: string;
  phoneNumber: string;
  email: string;
  age: string;
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
}

const emptyPerson = (): Person => ({
  name: '',
  phoneNumber: '',
  email: '',
  age: '',
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
  });

  const [submitted, setSubmitted] = useState<any | null>(null);

  useEffect(() => {
    // Try to initialize Material Kit input animations
    if (window.materialKit && typeof window.materialKit.input === 'function') {
      window.materialKit.input();
    } else if (window.materialKit && typeof window.materialKit.initFormInputs === 'function') {
      window.materialKit.initFormInputs();
    } else {
      // Fallback: trigger input animation by dispatching input event
      const inputs = document.querySelectorAll('.input-group-dynamic .form-control');
      inputs.forEach(input => {
        input.dispatchEvent(new Event('input', { bubbles: true }));
      });
    }
  }, [form.consultant]); // Re-run when consultant changes

  const handleTopLevelChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    console.log('handleTopLevelChange:', { name, value }); // Debug log
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePersonChange = (
    section: 'guarantor' | 'proponents',
    index: number,
    field: keyof Person,
    value: string
  ) => {
    setForm(prev => {
      const copy = { ...prev } as FormState;
      const arr = [...copy[section]];
      arr[index] = { ...arr[index], [field]: value } as Person;
      copy[section] = arr;
      return copy;
    });
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
    <section>
      <header>
        <div
          className="page-header min-vh-100"
          style={{
            backgroundImage:
              "url('/header-bg.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative',
          }}
        >
          <span className="mask bg-gradient-dark opacity-5" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}></span>
          <div className="container" style={{ position: 'relative', zIndex: 2 }}>
            <div className="row">
              <div className="col-lg-6 col-md-7 d-flex justify-content-center flex-column">
                <h1 className="text-white font-weight-black mb-4">Material Kit</h1>
                <p className="text-white opacity-8 lead pe-5 me-5">
                  The time is now for it be okay to be great. People in this world shun people for being nice.
                </p>
                <div className="buttons">
                  <button type="button" className="btn btn-white mt-4">Get Started</button>
                  <button type="button" className="btn text-white shadow-none mt-4">Read more</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      <div className="container py-4">
        <div className="row">
          <div className="col-lg-7 mx-auto d-flex justify-content-center flex-column">
            <h3 className="text-center">Mortgage Application</h3>
            <div className="card shadow" style={{ background: '#fff', borderRadius: 12 }}>
              <form role="form" id="mortgage-form" method="post" autoComplete="off" onSubmit={onSubmit}>
                <div className="card-body">
                  {/* Top-level fields */}
                  <div className="row">
                    <div className="col-md-6">
                      <div className="input-group input-group-dynamic mb-4">
                        <label className="form-label">Consultant</label>
                        <input className="form-control" name="consultant" value={form.consultant} onChange={handleTopLevelChange} aria-label="Consultant..." type="text" />
                      </div>
                    </div>
                    <div className="col-md-6 ps-2">
                      <div className="input-group input-group-dynamic mb-4">
                        <label className="form-label">Rents</label>
                        <input className="form-control" name="rents" value={form.rents} onChange={handleTopLevelChange} aria-label="Rents..." type="text" />
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-4">
                      <div className="input-group input-group-dynamic mb-4">
                        <label className="form-label">Purchase Value</label>
                        <input className="form-control" name="purchaseValue" value={form.purchaseValue} onChange={handleTopLevelChange} aria-label="Purchase Value..." type="text" />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="input-group input-group-dynamic mb-4">
                        <label className="form-label">Appraisal Value</label>
                        <input className="form-control" name="appraisalValue" value={form.appraisalValue} onChange={handleTopLevelChange} aria-label="Appraisal Value..." type="text" />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="input-group input-group-dynamic mb-4">
                        <label className="form-label">Financing Amount</label>
                        <input className="form-control" name="financingAmount" value={form.financingAmount} onChange={handleTopLevelChange} aria-label="Financing Amount..." type="text" />
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-4">
                      <div className="input-group input-group-dynamic mb-4">
                        <label className="form-label">Other Financing Amount</label>
                        <input className="form-control" name="otherFinancingAmount" value={form.otherFinancingAmount} onChange={handleTopLevelChange} aria-label="Other Financing Amount..." type="text" />
                      </div>
                    </div>
                    <div className="col-md-8">
                      <div className="input-group input-group-dynamic mb-4">
                        <label className="form-label">Own Capital</label>
                        <input className="form-control" name="ownCapital" value={form.ownCapital} onChange={handleTopLevelChange} aria-label="Own Capital..." type="text" />
                      </div>
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="input-group input-group-dynamic">
                      <label className="form-label">Comments</label>
                      <textarea className="form-control" name="comments" rows={2} value={form.comments} onChange={handleTopLevelChange} />
                    </div>
                  </div>
                  {/* Example validation row */}
                  <div className="row text-center py-3 mt-3">
                    <div className="col-4 ms-auto">
                      <input type="text" placeholder="Success" className="form-control is-valid" />
                    </div>
                    <div className="col-4 me-auto">
                      <input type="text" placeholder="Error" className="form-control is-invalid" />
                    </div>
                  </div>
                  {/* Proponents Section (first only, for style) */}
                  <div className="row mt-4">
                    <div className="col-md-12">
                      <h5 className="text-center">Proponents</h5>
                      {form.proponents.map((p, idx) => (
                        <div key={`proponent-${idx}`} className="card card-plain mb-4">
                          <div className="row">
                            <div className="col-md-6">
                              <div className="input-group input-group-dynamic mb-4">
                                <label className="form-label">Name</label>
                                <input className="form-control" value={p.name} onChange={e => handlePersonChange('proponents', idx, 'name', e.target.value)} aria-label="Name..." type="text" />
                              </div>
                            </div>
                            <div className="col-md-3">
                              <div className="input-group input-group-dynamic mb-4">
                                <label className="form-label">Phone</label>
                                <input className="form-control" value={p.phoneNumber} onChange={e => handlePersonChange('proponents', idx, 'phoneNumber', e.target.value)} aria-label="Phone..." type="text" />
                              </div>
                            </div>
                            <div className="col-md-3">
                              <div className="input-group input-group-dynamic mb-4">
                                <label className="form-label">Email</label>
                                <input className="form-control" value={p.email} onChange={e => handlePersonChange('proponents', idx, 'email', e.target.value)} aria-label="Email..." type="email" />
                              </div>
                            </div>
                          </div>
                          {/* ...other proponent fields in similar style... */}
                          <div className="row">
                            <div className="col-md-12 d-flex justify-content-end">
                              <button type="button" className="btn btn-danger btn-sm" onClick={() => removePerson('proponents', idx)} disabled={form.proponents.length <= 1}>
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                      <button type="button" className="btn bg-gradient-dark w-100 mb-4" onClick={() => addPerson('proponents')}>
                        + Add Proponent
                      </button>
                    </div>
                  </div>
                  {/* Terms and Conditions */}
                  <div className="row">
                    <div className="col-md-12">
                      <div className="form-check form-switch mb-4 d-flex align-items-center">
                        <input className="form-check-input" type="checkbox" id="flexSwitchCheckDefault" defaultChecked />
                        <label className="form-check-label ms-3 mb-0" htmlFor="flexSwitchCheckDefault">I agree to the <a href="#" className="text-dark" onClick={e => e.preventDefault()}><u>Terms and Conditions</u></a>.</label>
                      </div>
                    </div>
                    <div className="col-md-12">
                      <button type="submit" className="btn bg-gradient-dark w-100">Submit</button>
                    </div>
                  </div>
                </div>
              </form>
              {submitted && (
                <div className="card mt-4">
                  <div className="card-header card-header-info">
                    <h4 className="card-title">Preview JSON</h4>
                  </div>
                  <div className="card-body">
                    <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>{JSON.stringify(submitted, null, 2)}</pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MortageApplication;
