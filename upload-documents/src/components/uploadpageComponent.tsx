import { useSearchParams } from "react-router-dom";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useTranslation } from "./TranslationProvider";
import LogoSection from "./LogoSection";

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
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
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

  useEffect(() => {
    if (token) {
      fetchDocumentation(token);
    } else {
      setIsValid(false);
    }
  }, [token]);

  const fetchDocumentation = async (token: string) => {
    try {
      const response = await fetch(`${DOCUMENTATION_HOST}/request-documentation/upload?token=${token}`);

      if (!response.ok) {
        throw new Error("Invalid or expired token");
      }

      const data = await response.json();
      const formattedData: Documentation = {
        request_id: data.request_id,
        documents: data.documents,
        customerId: data.customer_id, // Extract customerId from response
      };

      setDocumentation(formattedData);
      setCustomerId(data.customer_id || ''); // Set customerId in state
      setIsValid(true);
    } catch (error) {
      setIsValid(false);
      setError((error as Error).message);
    }
  };

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
  const uploadDocuments = documentation ? documentation.documents.filter(doc => doc.key !== 'rgpd') : [];

  // Only count non-rgpd documents for required file count
  const requiredFileCount = useMemo(() => {
    return uploadDocuments.reduce((sum, d) => sum + d.quantity, 0);
  }, [uploadDocuments]);

  const allFilesSelected = useMemo(() => {
    const filled = Object.values(selectedFiles).filter(Boolean).length;
    return requiredFileCount > 0 && filled === requiredFileCount;
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
      const response = await fetch(`${DOCUMENTATION_HOST}/request-documentation/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "An error occurred while uploading.");
      }

      setUploadSuccess(data.message || "Upload successful");
      if (onUploadComplete) onUploadComplete();
    } catch (error) {
      setUploadError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setUploadSuccess(null);
    //fetchDocumentation("abc"); // Refresh the page data after closing the modal
    setIsValid(false);
  };

  // Check if any document with key 'rgpd' is present
  const hasRgpdDocument = documentation?.documents.some(doc => doc.key === 'rgpd');

  if (isValid === false) {
    return (
      <div className="bg-gray-200">
        <LogoSection />
        
        {/* Hero Error Section */}
        <div className="page-header min-vh-75" style={{ 
          background: 'linear-gradient(195deg, #ec407a 0%, #d81b60 100%)', 
          position: 'relative',
          overflow: 'hidden'
        }}>
          <span className="mask bg-gradient-dark opacity-2"></span>
          
          {/* Decorative Elements */}
          <div style={{
            position: 'absolute',
            top: '10%',
            right: '10%',
            width: '200px',
            height: '200px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
            filter: 'blur(60px)'
          }}></div>
          <div style={{
            position: 'absolute',
            bottom: '20%',
            left: '5%',
            width: '150px',
            height: '150px',
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '50%',
            filter: 'blur(50px)'
          }}></div>
          
          <div className="container" style={{ position: 'relative', zIndex: 2 }}>
            <div className="row">
              <div className="col-lg-8 col-md-10 mx-auto text-center text-white py-7">
                <div className="mb-5">
                  <div className="icon-shape bg-white shadow-lg mx-auto mb-4" style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <i className="material-icons text-dark" style={{ fontSize: '2.5rem' }}>error_outline</i>
                  </div>
                  <h1 className="display-3 font-weight-bolder mb-4 text-white">Oops! Something went wrong</h1>
                  <p className="lead opacity-9 mb-5 px-5">
                    We're sorry, but we couldn't load your document upload page. This might be due to an invalid or expired link.
                  </p>
                </div>
                
                <div className="card border-0 shadow-xl mx-auto" style={{ 
                  borderRadius: '1.5rem', 
                  maxWidth: '500px',
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)'
                }}>
                  <div className="card-body p-5">
                    <div className="alert alert-warning border-0 mb-4" style={{ 
                      borderRadius: '1rem',
                      background: 'linear-gradient(45deg, #ff9800, #f57c00)',
                      color: 'white'
                    }}>
                      <div className="d-flex align-items-center">
                        <i className="material-icons me-3" style={{ fontSize: '1.5rem' }}>warning</i>
                        <div>
                          <strong>Error Details:</strong>
                          <div className="mt-1">{error || translations.documentationUnavailable}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <h5 className="text-dark font-weight-bold mb-3">What can you do?</h5>
                      <div className="row text-start">
                        <div className="col-12 mb-3">
                          <div className="d-flex align-items-center">
                            <div className="icon-shape bg-gradient-success shadow me-3" style={{
                              width: '35px',
                              height: '35px',
                              borderRadius: '0.5rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <i className="material-icons text-white" style={{ fontSize: '1rem' }}>refresh</i>
                            </div>
                            <span className="text-sm text-dark">Try refreshing the page</span>
                          </div>
                        </div>
                        <div className="col-12 mb-3">
                          <div className="d-flex align-items-center">
                            <div className="icon-shape bg-gradient-info shadow me-3" style={{
                              width: '35px',
                              height: '35px',
                              borderRadius: '0.5rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <i className="material-icons text-white" style={{ fontSize: '1rem' }}>link</i>
                            </div>
                            <span className="text-sm text-dark">Check if your link is correct</span>
                          </div>
                        </div>
                        <div className="col-12">
                          <div className="d-flex align-items-center">
                            <div className="icon-shape bg-gradient-primary shadow me-3" style={{
                              width: '35px',
                              height: '35px',
                              borderRadius: '0.5rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <i className="material-icons text-white" style={{ fontSize: '1rem' }}>support_agent</i>
                            </div>
                            <span className="text-sm text-dark">Contact support if the problem persists</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer className="py-4" style={{ backgroundColor: '#ffffff', borderTop: '1px solid #e9ecef' }}>
          <div className="container text-center">
            <span className="text-muted">
              made by <a href="https://goncalomiranda.dev" className="text-primary text-decoration-none" target="_blank" rel="noopener noreferrer">goncalomiranda.dev</a>
            </span>
          </div>
        </footer>
      </div>
    );
  }

  if (!documentation) {
    return (
      <div className="bg-gray-200" style={{ minHeight: '100vh' }}>
        <LogoSection />
        <div className="container-fluid d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
          <div className="text-center">
            <div className="card border-0 shadow-lg p-5" style={{ borderRadius: '1rem' }}>
              <div className="spinner-border text-primary mb-4" role="status" style={{ width: '3rem', height: '3rem' }}>
                <span className="visually-hidden">Loading...</span>
              </div>
              <h5 className="text-muted">Loading your documents...</h5>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-200">
      <LogoSection />
      
      {/* Hero Header */}
      <div className="page-header min-vh-30" style={{ backgroundColor: 'linear-gradient(195deg, #42424a 0%, #191919 100%)', position: 'relative' }}>
        <span className="mask bg-gradient-dark opacity-4"></span>
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div className="row">
            <div className="col-lg-8 col-md-10 mx-auto text-center text-white py-5">
              <h1 className="display-4 font-weight-bolder mb-4">{translations.uploadDocuments}</h1>
              <p className="lead opacity-8 mb-0">{translations.uploadDescription}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <section className="py-7" style={{ backgroundColor: '#f8f9fa' }}>
        <div className="container">
          {token && !uploadSuccess && (
            <div className="row justify-content-center">
              <div className="col-lg-10">
                <div className="text-center mb-6">
                  <h2 className="font-weight-bold text-dark mb-3">{translations.requiredDocuments}</h2>
                  <p className="text-muted">Please upload all required documents to complete your application</p>
                </div>
                
                <form onSubmit={handleUpload} encType="multipart/form-data">
                  <input type="hidden" name="request_id" value={documentation.request_id} />
                  
                  {/* Document Upload Cards */}
                  <div className="row">
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

      <footer className="py-5" style={{ backgroundColor: '#ffffff', borderTop: '1px solid #e9ecef' }}>
        <div className="container text-center">
          <div className="row">
            <div className="col-12">
              <p className="text-muted mb-0">
                Made with <i className="material-icons text-danger text-sm">favorite</i> by 
                <a href="https://goncalomiranda.dev" className="text-primary text-decoration-none font-weight-bold ms-1" target="_blank" rel="noopener noreferrer">
                  goncalomiranda.dev
                </a>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default UploadPage;
