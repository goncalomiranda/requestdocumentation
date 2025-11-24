import { useSearchParams } from "react-router-dom";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useTranslation } from "./TranslationProvider";
import Footer from "./Footer";

interface Document {
  key: string;
  value: string;
  quantity: number;
}

interface Documentation {
  request_id: string;
  documents: Document[];
  customerId?: string; // Add customerId to the Documentation interface
}

interface UploadPageProps {
  onUploadComplete?: () => void;
}

function UploadPage({ onUploadComplete }: UploadPageProps) {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { translations, language } = useTranslation();

  const [documentation, setDocumentation] = useState<Documentation | null>(null);
  const [customerId, setCustomerId] = useState<string>(''); // Add customerId state
  const [loading, setLoading] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  // GDPR related state
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [consentA, setConsentA] = useState(false);
  const [consentB, setConsentB] = useState(false);
  const [consentC, setConsentC] = useState(false);
  const [consentD, setConsentD] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Record<string, boolean>>({});
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const requiredDocumentsRef = useRef<HTMLElement>(null);

  const scrollToRequiredDocuments = () => {
    requiredDocumentsRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
  };

  // PDF src logic based on selected language
  const privacyPdfSrc = language === 'pt' ? '/RGPD_LVF_PT_v1.0.pdf' : '/RGPD_LVF_EN_v1.0.pdf';

  // Get DOCUMENTATION_HOST from environment variable
  const DOCUMENTATION_HOST = import.meta.env.VITE_DOCUMENTATION_HOST || "https://wrongurl.com";

  // Mobile detection hook
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const fetchDocumentation = useCallback(async (token: string) => {
    try {
      const response = await fetch(`${DOCUMENTATION_HOST}/request-documentation/upload?token=${token}`);

      if (!response.ok) {
        return; // Don't set documentation if API fails
      }

      const data = await response.json();
      const formattedData: Documentation = {
        request_id: data.request_id,
        documents: data.documents,
        customerId: data.customer_id, // Extract customerId from response
      };

      setDocumentation(formattedData);
      setCustomerId(data.customer_id || ''); // Set customerId in state
    } catch {
      // Don't set documentation if API fails
    }
  }, [DOCUMENTATION_HOST]);

  useEffect(() => {
    if (token) {
      fetchDocumentation(token);
    }
  }, [token, fetchDocumentation]);

  // Initialize tracking of required file inputs once documentation loads
  useEffect(() => {
    if (documentation) {
      const init: Record<string, boolean> = {};
      documentation.documents.forEach((doc) => {
        for (let i = 0; i < doc.quantity; i++) {
          const key = `documents[${doc.key}][${i}]`;
            init[key] = false;
        }
      });
      setSelectedFiles(init);
    }
  }, [documentation]);

  // Exclude 'rgpd' from the upload list
  const uploadDocuments = useMemo(() => {
    return documentation ? documentation.documents.filter(doc => doc.key !== 'rgpd') : [];
  }, [documentation]);

  // Only count non-rgpd documents for required file count
  const requiredFileCount = useMemo(() => {
    return uploadDocuments.reduce((sum, d) => sum + d.quantity, 0);
  }, [uploadDocuments]);

  const allFilesSelected = useMemo(() => {
    const filled = Object.values(selectedFiles).filter(Boolean).length;
    // If no upload documents required (only RGPD), consider files selected as true
    if (requiredFileCount === 0) return true;
    return filled === requiredFileCount;
  }, [selectedFiles, requiredFileCount]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.name;
    setSelectedFiles(prev => ({ ...prev, [name]: !!e.target.files && e.target.files.length > 0 }));
  }, []);

  const onPdfScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 5; // small threshold
    if (atBottom && !hasScrolledToBottom) {
      setHasScrolledToBottom(true);
    }
  };

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!allFilesSelected || (hasRgpdDocument && !(consentChecked && consentA && consentB && consentC && consentD))) return;
    setLoading(true);
    setUploadSuccess(null);
    setUploadError(null);

    const formData = new FormData(e.currentTarget);
    // Append consent metadata only if RGPD is requested
    if (hasRgpdDocument) {
      formData.append("consentGiven", consentChecked ? "true" : "false");
      formData.append("consentA", consentA ? "true" : "false");
      formData.append("consentB", consentB ? "true" : "false");
      formData.append("consentC", consentC ? "true" : "false");
      formData.append("consentD", consentD ? "true" : "false");
      formData.append("consentVersion", privacyPdfSrc.replace("/", ""));
      formData.append("givenAt", new Date().toISOString());
      formData.append("consentTimezone", Intl.DateTimeFormat().resolvedOptions().timeZone || '');
    }
    formData.append("customerId", customerId);
    formData.append("userAgent", navigator.userAgent);
    formData.append("browserLanguage", navigator.language);
    
    

    try {
      // Validate backend host configuration early
      if (!DOCUMENTATION_HOST || DOCUMENTATION_HOST.includes('wrongurl.com')) {
        throw new Error('Upload service URL not configured. Please set VITE_DOCUMENTATION_HOST (e.g., http://localhost:3000).');
      }

      // Add request_id redundantly in query string to match backend expectations
      const requestId = documentation?.request_id || '';
      const url = `${DOCUMENTATION_HOST}/request-documentation/upload${requestId ? `?request_id=${encodeURIComponent(requestId)}` : ''}`;

      // Add a timeout to avoid hanging requests
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 30000); // 30s timeout

      let response: Response;
      try {
        response = await fetch(url, {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      // Defensively parse the response (support empty or non-JSON bodies)
      const raw = await response.text();
  let data: unknown = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        data = null;
      }

      if (!response.ok) {
        const messageFromData = (typeof data === 'object' && data !== null && 'message' in data)
          ? String((data as Record<string, unknown>).message ?? '')
          : '';
        const msg = messageFromData || raw || "An error occurred while uploading.";
        throw new Error(typeof msg === 'string' ? msg : 'Upload failed');
      }

      const successMessage = (typeof data === 'object' && data !== null && 'message' in data)
        ? String((data as Record<string, unknown>).message ?? '')
        : '';
      setUploadSuccess(successMessage || "Upload successful");
      if (onUploadComplete) onUploadComplete();
    } catch (error: unknown) {
      const err = error as { name?: string; message?: string } | undefined;
      if (err?.name === 'AbortError') {
        setUploadError('Request timed out. Please try again.');
      } else if (typeof err?.message === 'string' && /Failed to fetch|NetworkError|TypeError|ERR_EMPTY_RESPONSE/i.test(err.message)) {
        setUploadError('Network error or empty server response. Please check your link and try again.');
      } else {
        setUploadError(err?.message || 'Unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setUploadSuccess(null);
    //fetchDocumentation("abc"); // Refresh the page data after closing the modal
  };

  // Check if any document with key 'rgpd' is present
  const hasRgpdDocument = documentation?.documents.some(doc => doc.key === 'rgpd');

  return (
    <div className="bg-gray-200">
      {/* <LogoSection />
       */}
      {/* Hero Header */}
      <div className="page-header min-vh-30" style={{ backgroundColor: '#f8f9fa', position: 'relative', paddingTop: '6rem', paddingBottom: '4rem' }}>
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div className="row align-items-center h-100">
            <div className="col-lg-7 col-md-7 d-flex justify-content-center flex-column">
              <div className="mb-3">
                <span className="badge bg-gradient-dark text-white px-3 py-2" style={{ borderRadius: '2rem', fontSize: '0.875rem' }}>
                  LVF - Luis Miguel Filipe, Lda
                </span>
              </div>
              <h1 className="display-4 font-weight-bolder mb-4 text-dark">{translations.uploadDocuments}</h1>
              <p className="lead text-muted pe-5 me-5 mb-5">
                Securely upload your documents with LVF's trusted platform. Fast, encrypted, and designed to protect your sensitive financial information.
              </p>
              <div className="buttons">
                {token && documentation && (
                  <button 
                    type="button" 
                    className="btn bg-gradient-dark btn-lg me-3" 
                    style={{ borderRadius: '0.75rem' }}
                    onClick={scrollToRequiredDocuments}
                  >
                    Get Started
                  </button>
                )}
                <a href="https://www.lvf.pt" target="_blank" rel="noopener noreferrer" className="btn btn-outline-dark btn-lg" style={{ borderRadius: '0.75rem' }}>
                  Learn More
                </a>
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

      {/* Trusted By Section */}
      <section className="py-5" style={{ backgroundColor: '#ffffff' }}>
        <div className="container">
          <div className="row">
            <div className="col-lg-6 mx-auto text-center">
              <h4 className="text-muted mb-1">Trusted by over</h4>
              <h2 className="text-dark font-weight-bold mb-3">8,500+ customers</h2>
              <p className="lead text-muted mb-5">
                Thousands of clients trust our secure document upload system for sensitive financial information.
              </p>
            </div>
          </div>
          
          <div className="row text-center">
            <div className="col-md-4 col-6 mb-4">
              <div className="p-3">
                <h3 className="text-gradient text-primary font-weight-bold mb-0">8.5K+</h3>
                <p className="text-sm text-muted mb-0">Documents Uploaded</p>
              </div>
            </div>
            <div className="col-md-4 col-6 mb-4">
              <div className="p-3">
                <h3 className="text-gradient text-primary font-weight-bold mb-0">99.9%</h3>
                <p className="text-sm text-muted mb-0">Security Rate</p>
              </div>
            </div>
            <div className="col-md-4 col-6 mb-4">
              <div className="p-3">
                <h3 className="text-gradient text-primary font-weight-bold mb-0">2min</h3>
                <p className="text-sm text-muted mb-0">Average Upload Time</p>
              </div>
            </div>
          </div>
          
        </div>
      </section>

      {/* Main Content */}
      {token && documentation && (
        <section className="py-7" style={{ backgroundColor: '#f8f9fa' }} ref={requiredDocumentsRef}>
          <div className="container">
            {!uploadSuccess && (
              <div className="row justify-content-center">
                <div className="col-lg-10">
                  <div className="text-center mb-6">
                    <h2 className="font-weight-bold text-dark mb-3">{translations.requiredDocuments}</h2>
                    <p className="text-muted">Please upload all required documents to complete your application</p>
                  </div>

                  <form onSubmit={handleUpload} encType="multipart/form-data">
                    <input type="hidden" name="request_id" value={documentation.request_id} />

                    {/* Document Upload Cards */}
                    <div className="row justify-content-center">
                      {uploadDocuments.map((doc, index) => (
                        <div className="col-lg-6 mb-4" key={doc.key}>
                          <div className="card h-100 border-0 shadow-lg" style={{ borderRadius: '1rem' }}>
                            <div className="card-header bg-gradient-dark text-white" style={{ borderRadius: '1rem 1rem 0 0', padding: '1.25rem', color: 'white' }}>
                              <div className="d-flex align-items-center">
                                <i className="material-icons me-3" style={{ color: 'white' }}>description</i>
                                <div>
                                  <h5 className="mb-0 font-weight-bold" style={{ color: 'white' }}>{doc.value}</h5>
                                  <small className="opacity-8" style={{ color: 'white' }}>Required: {doc.quantity} file{doc.quantity > 1 ? 's' : ''}</small>
                                </div>
                              </div>
                            </div>
                            <div className="card-body p-4">
                              {[...Array(doc.quantity)].map((_, i) => (
                                <div className="mb-3" key={i}>
                                  <label htmlFor={`upload_${index}_${i}`} className="form-label font-weight-bold text-dark mb-2">
                                    <i className="material-icons text-sm me-1">attach_file</i>
                                    {translations.uploadFile} {i + 1}
                                  </label>
                                  <input
                                    type="file"
                                    className="form-control"
                                    id={`upload_${index}_${i}`}
                                    name={`documents[${doc.key}][${i}]`}
                                    required
                                    onChange={handleFileChange}
                                    style={{ borderRadius: '0.5rem', border: '1px solid #d2d6da' }}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* GDPR Consent Section */}
                    {hasRgpdDocument && (
                      <div className="row justify-content-center mt-6">
                        <div className="col-lg-12">
                          <div className="card border-0 shadow-lg" style={{ borderRadius: '1rem' }}>
                            <div className="card-header bg-gradient-dark text-white" style={{ borderRadius: '1rem 1rem 0 0', padding: '1.5rem', color: 'white' }}>
                              <div className="d-flex align-items-center">
                                <i className="material-icons me-3" style={{ color: 'white' }}>security</i>
                                <h4 className="mb-0 font-weight-bold" style={{ color: 'white' }}>{translations.consents?.privacyNoticeTitle}</h4>
                              </div>
                            </div>
                            <div className="card-body p-4">
                              {/* PDF Viewer */}
                              <div className="mb-4">
                                <div className="alert alert-info border-0" style={{ borderRadius: '0.75rem' }}>
                                  <i className="material-icons me-2">info</i>
                                  <strong>Please review the privacy policy below before continuing.</strong>
                                </div>

                                <div
                                  className="border"
                                  style={{
                                    borderRadius: '0.75rem',
                                    height: '400px',
                                    overflowY: 'auto',
                                    backgroundColor: '#fff',
                                    position: 'relative'
                                  }}
                                  onScroll={onPdfScroll}
                                >
                                  <iframe
                                    src={privacyPdfSrc}
                                    title="Customer Privacy Notice"
                                    style={{
                                      width: '100%',
                                      height: '800px',
                                      border: 'none',
                                      borderRadius: '0.75rem'
                                    }}
                                  />

                                  {/* Mobile Overlay */}
                                  {isMobile && (
                                    <div
                                      style={{
                                        position: 'absolute',
                                        top: '20px',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        zIndex: 10
                                      }}
                                    >
                                      <a
                                        href={privacyPdfSrc}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn bg-gradient-dark text-white shadow-lg"
                                        style={{ borderRadius: '2rem' }}
                                        onClick={() => setHasScrolledToBottom(true)}
                                      >
                                        <i className="material-icons me-2">open_in_new</i>
                                        Open Privacy Policy
                                      </a>
                                    </div>
                                  )}
                                </div>

                                <div className="text-center mt-3">
                                  <a
                                    href={privacyPdfSrc}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary text-decoration-none"
                                    onClick={() => setHasScrolledToBottom(true)}
                                  >
                                    <i className="material-icons text-sm me-1">open_in_new</i>
                                    Open in new tab
                                  </a>
                                </div>
                              </div>

                              {/* Consent Checkboxes */}
                              <div className="mb-4">
                                <h6 className="font-weight-bold text-dark mb-4">Data Processing Consent</h6>

                                {['A', 'B', 'C', 'D'].map((letter) => (
                                  <div className="form-check mb-3 p-3 border" style={{ borderRadius: '0.75rem', backgroundColor: '#f8f9fa' }} key={letter}>
                                    <input
                                      type="checkbox"
                                      className="form-check-input"
                                      id={`consent${letter}`}
                                      disabled={!hasScrolledToBottom}
                                      checked={letter === 'A' ? consentA : letter === 'B' ? consentB : letter === 'C' ? consentC : consentD}
                                      onChange={e => {
                                        if (letter === 'A') setConsentA(e.target.checked);
                                        else if (letter === 'B') setConsentB(e.target.checked);
                                        else if (letter === 'C') setConsentC(e.target.checked);
                                        else setConsentD(e.target.checked);
                                      }}
                                    />
                                    <label className="form-check-label text-dark ms-2" htmlFor={`consent${letter}`}>
                                      <strong>{letter}.</strong> {translations.consents?.[letter as keyof typeof translations.consents]}
                                    </label>
                                  </div>
                                ))}
                              </div>

                              {/* Main Consent */}
                              <div className="form-check p-4 bg-gradient-dark" style={{ borderRadius: '0.75rem' }}>
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  id="gdprConsent"
                                  disabled={!hasScrolledToBottom}
                                  checked={consentChecked}
                                  onChange={e => setConsentChecked(e.target.checked)}
                                />
                                <label className="form-check-label text-white font-weight-bold ms-2" htmlFor="gdprConsent">
                                  <i className="material-icons text-sm me-2">verified_user</i>
                                  {translations.consents?.RGPD_CONSENT}
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Submit Section */}
                    <div className="row justify-content-center mt-6">
                      <div className="col-lg-6 text-center">
                        <div className="card border-0 shadow-lg p-4" style={{ borderRadius: '1rem' }}>
                          <button
                            type="submit"
                            className="btn bg-gradient-dark btn-lg w-100 mb-3"
                            disabled={loading || !allFilesSelected || (hasRgpdDocument && !(consentChecked && consentA && consentB && consentC && consentD))}
                            style={{ borderRadius: '0.75rem', padding: '15px' }}
                          >
                            {loading ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" />
                                {translations.uploading}
                              </>
                            ) : (
                              <>
                                <i className="material-icons me-2">cloud_upload</i>
                                {translations.submitDocuments}
                              </>
                            )}
                          </button>

                          {(!allFilesSelected || (hasRgpdDocument && !consentChecked)) && (
                            <div className="alert alert-warning border-0 mt-3" style={{ borderRadius: '0.5rem' }}>
                              <small>
                                {!allFilesSelected && <div><i className="material-icons text-sm me-1">warning</i> All required files must be selected</div>}
                                {hasRgpdDocument && !consentChecked && <div><i className="material-icons text-sm me-1">privacy_tip</i> GDPR consent required</div>}
                              </small>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Success Modal */}
      {uploadSuccess && (
        <div className="modal fade show d-block" tabIndex={-1} role="dialog" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content shadow-lg" style={{ border: 'none', borderRadius: '12px' }}>
              <div className="modal-header bg-gradient-dark text-white" style={{ borderRadius: '12px 12px 0 0' }}>
                <h5 className="modal-title font-weight-bold">{translations.success}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={handleSuccessClose}></button>
              </div>
              <div className="modal-body bg-white text-dark p-4">{uploadSuccess}</div>
              <div className="modal-footer bg-white" style={{ borderRadius: '0 0 12px 12px' }}>
                <button type="button" className="btn bg-gradient-dark text-white" onClick={handleSuccessClose}>
                  {translations.close}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {uploadError && (
        <div className="modal fade show d-block" tabIndex={-1} role="dialog" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content shadow-lg" style={{ border: 'none', borderRadius: '12px' }}>
              <div className="modal-header bg-gradient-danger text-white" style={{ borderRadius: '12px 12px 0 0' }}>
                <h5 className="modal-title font-weight-bold">{translations.error}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setUploadError(null)}></button>
              </div>
              <div className="modal-body bg-white text-dark p-4">{uploadError}</div>
              <div className="modal-footer bg-white" style={{ borderRadius: '0 0 12px 12px' }}>
                <button type="button" className="btn bg-gradient-danger text-white" onClick={() => setUploadError(null)}>
                  {translations.close}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default UploadPage;
