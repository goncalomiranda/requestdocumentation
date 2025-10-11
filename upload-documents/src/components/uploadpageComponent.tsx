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
      <>
        <LogoSection />
        <div className="bg-dark text-secondary px-4 pt-2 pb-5 text-center" id="mainDivDocumentation">
          <div className="py-4">
            <h1 className="display-5 fw-bold text-white">{translations.uploadDocuments}</h1>
            <div className="col-lg-6 mx-auto">
              <p className="fs-5 mb-4">{translations.uploadDescription}</p>
              <p className="text-info" style={{display: "none"}}>{error || translations.documentationUnavailable}</p>
            </div>
          </div>
        </div>
        <footer className="fixed-bottom bg-dark text-center py-3">
          <span className="text-secondary">
            made by <a href="https://goncalomiranda.dev" className="text-info text-decoration-none" target="_blank" rel="noopener noreferrer">goncalomiranda.dev</a>
          </span>
        </footer>
      </>
    );
  }

  if (!documentation) {
    return <div className="text-center text-light">Loading...</div>;
  }

  return (
    <main>
      <LogoSection />
      <div className="bg-dark text-secondary px-4 pt-2 pb-5 text-center" id="mainDivDocumentation">
        <div className="py-4">
          <h1 className="display-5 fw-bold text-white">{translations.uploadDocuments}</h1>
          <div className="col-lg-6 mx-auto">
            <p className="fs-5 mb-4">{translations.uploadDescription}</p>
          </div>

          {/* Hide this section if token is missing or after successful submission */}
          {token && !uploadSuccess && (
            <div id="requiredDocumentsDiv">
              <h2 className="mb-4">{translations.requiredDocuments}</h2>
              <form onSubmit={handleUpload} encType="multipart/form-data">
                <input type="hidden" name="request_id" value={documentation.request_id} />
                <div className="row justify-content-center bg-dark text-light py-4" id="documentationList">
                  {uploadDocuments.map((doc, index) => (
                    <div className="col-md-8" key={doc.key}>
                      <div className="card border-info mb-3 bg-dark text-light">
                        <div className="card-header bg-dark text-info">
                          <strong>{doc.value}</strong>
                        </div>
                        <div className="card-body">
                          <p className="card-text">{translations.quantityRequired}: {doc.quantity}</p>
                          {[...Array(doc.quantity)].map((_, i) => (
                            <div className="mb-3" key={i}>
                              <label htmlFor={`upload_${index}_${i}`} className="form-label">
                                {translations.uploadFile} {i + 1}
                              </label>
                              <input
                                type="file"
                                className="form-control"
                                id={`upload_${index}_${i}`}
                                name={`documents[${doc.key}][${i}]`}
                                required
                                onChange={handleFileChange}
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
                  <div id="gdprConsentDiv" className="text-start mt-4 mb-4" style={{ maxWidth: '1000px', margin: '0 auto' }}>
                    <h3 style={{ fontSize: '1.25rem' }}>{translations.consents?.privacyNoticeTitle}</h3>
                    {/* Consent Intro from translations */}
                    <br />
                    
                    {/* Mobile-friendly PDF viewer */}
                    <div style={{ marginBottom: '16px' }}>
                      <div
                        style={{ 
                          border: '1px solid #0dcaf0', 
                          borderRadius: 4, 
                          height: '300px', 
                          overflowY: 'auto', 
                          marginBottom: 12,
                          WebkitOverflowScrolling: 'touch', // Enable momentum scrolling on iOS
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
                            display: 'block'
                          }}
                        />
                        
                        {/* Overlay for mobile with link to open PDF */}
                        <div 
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0,0,0,0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: isMobile ? 1 : 0,
                            pointerEvents: isMobile ? 'auto' : 'none',
                            transition: 'opacity 0.3s ease'
                          }}
                          className="mobile-pdf-overlay"
                        >
                          <a
                            href={privacyPdfSrc}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              background: '#0dcaf0',
                              color: 'white',
                              padding: '12px 24px',
                              borderRadius: '6px',
                              textDecoration: 'none',
                              fontWeight: 'bold',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                            }}
                            onClick={() => {
                              // Automatically mark as scrolled when opening PDF on mobile
                              if (isMobile) {
                                setHasScrolledToBottom(true);
                              }
                            }}
                          >
                            📄 Open Privacy Policy
                          </a>
                        </div>
                      </div>
                      
                      {/* Alternative: Direct link for mobile users */}
                      <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                        <a
                          href={privacyPdfSrc}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: '#0dcaf0',
                            textDecoration: 'underline',
                            fontSize: '14px'
                          }}
                          onClick={() => {
                            // Mark as read when clicking the direct link
                            setHasScrolledToBottom(true);
                          }}
                        >
                          Can't scroll? Click here to open Privacy Policy in new tab
                        </a>
                      </div>
                    </div>

                    {/* Consent checkboxes below the iframe */}
                    <div className="mb-2" style={{ fontSize: '0.95rem', color: '#fff' }}>
                      {/* Consent A */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                        <input
                          type="checkbox"
                          id="consentA"
                          disabled={!hasScrolledToBottom}
                          checked={consentA}
                          onChange={e => setConsentA(e.target.checked)}
                          style={{ verticalAlign: 'middle', marginRight: 4 }}
                        />
                        <span style={{ lineHeight: 1.5 }}> <strong>A.</strong> {translations.consents?.A}</span>
                      </div>
                      {/* Consent B */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                        <input
                          type="checkbox"
                          id="consentB"
                          disabled={!hasScrolledToBottom}
                          checked={consentB}
                          onChange={e => setConsentB(e.target.checked)}
                          style={{ verticalAlign: 'middle', marginRight: 4 }}
                        />
                        <span style={{ lineHeight: 1.5 }}><strong>B.</strong> {translations.consents?.B}</span>
                      </div>
                      {/* Consent C */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                        <input
                          type="checkbox"
                          id="consentC"
                          disabled={!hasScrolledToBottom}
                          checked={consentC}
                          onChange={e => setConsentC(e.target.checked)}
                          style={{ verticalAlign: 'middle', marginRight: 4 }}
                        />
                        <span style={{ lineHeight: 1.5 }}><strong>C.</strong>  {translations.consents?.C}</span>
                      </div>
                      {/* Consent D */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                        <input
                          type="checkbox"
                          id="consentD"
                          disabled={!hasScrolledToBottom}
                          checked={consentD}
                          onChange={e => setConsentD(e.target.checked)}
                          style={{ verticalAlign: 'middle', marginRight: 4 }}
                        />
                        <span style={{ lineHeight: 1.5 }}><strong>D.</strong> {translations.consents?.D}</span>
                      </div>
                    </div>
                    {/* Main consent checkbox remains below the consents */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="checkbox"
                        id="gdprConsent"
                        disabled={!hasScrolledToBottom}
                        checked={consentChecked}
                        onChange={e => setConsentChecked(e.target.checked)}
                      />
                      <label htmlFor="gdprConsent" style={{ margin: 4 }}>
                        {translations.consents?.RGPD_CONSENT}
                      </label>
                    </div>
                  </div>
                )}

                <div className="text-center">
                  <button
                    type="submit"
                    className="btn btn-outline-light btn-lg px-4"
                    disabled={loading || !allFilesSelected || (hasRgpdDocument && !(consentChecked && consentA && consentB && consentC && consentD))}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-grow spinner-grow-sm me-2" role="status" />
                        {translations.uploading}
                      </>
                    ) : (
                      translations.submitDocuments
                    )}
                  </button>
                  <div style={{ marginTop: 10, fontSize: 12 }}>
                    {!allFilesSelected && <span>All required files must be selected. </span>}
                    {hasRgpdDocument && !consentChecked && <span>GDPR consent required.</span>}
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Success Modal */}
      {uploadSuccess && (
        <div className="modal fade show d-block" tabIndex={-1} role="dialog" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content bg-white text-dark shadow-lg" style={{ border: 'none', borderRadius: '8px' }}>
              <div className="modal-header" style={{ borderBottom: '1px solid #e9ecef', backgroundColor: 'white' }}>
                <h5 className="modal-title text-success fw-bold">{translations.success}</h5>
                <button type="button" className="btn-close" onClick={handleSuccessClose}></button>
              </div>
              <div className="modal-body" style={{ backgroundColor: 'white', color: '#333' }}>{uploadSuccess}</div>
              <div className="modal-footer" style={{ borderTop: '1px solid #e9ecef', backgroundColor: 'white' }}>
                <button type="button" className="btn btn-success" onClick={handleSuccessClose}>
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
            <div className="modal-content bg-white text-dark shadow-lg" style={{ border: 'none', borderRadius: '8px' }}>
              <div className="modal-header" style={{ borderBottom: '1px solid #e9ecef', backgroundColor: 'white' }}>
                <h5 className="modal-title text-danger fw-bold">{translations.error}</h5>
                <button type="button" className="btn-close" onClick={() => setUploadError(null)}></button>
              </div>
              <div className="modal-body" style={{ backgroundColor: 'white', color: '#333' }}>{uploadError}</div>
              <div className="modal-footer" style={{ borderTop: '1px solid #e9ecef', backgroundColor: 'white' }}>
                <button type="button" className="btn btn-danger" onClick={() => setUploadError(null)}>
                  {translations.close}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="fixed-bottom bg-dark text-center py-3">
        <span className="text-secondary">
          made by <a href="https://goncalomiranda.dev" className="text-info text-decoration-none" target="_blank" rel="noopener noreferrer">goncalomiranda.dev</a>
        </span>
      </footer>
    </main>
  );
}

export default UploadPage;
