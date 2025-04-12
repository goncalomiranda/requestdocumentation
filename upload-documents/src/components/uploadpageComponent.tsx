import { useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";

interface Document {
  key: string;
  value: string;
  quantity: number;
}

interface Documentation {
  request_id: string;
  documents: Document[];
}

function UploadPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [documentation, setDocumentation] = useState<Documentation | null>(null);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      fetchDocumentation(token);
    } else {
      setIsValid(false);
    }
  }, [token]);

  const fetchDocumentation = async (token: string) => {
    try {
      const response = await fetch(`https://ts.goncalomiranda.dev/request-documentation/upload?token=${token}`);

      if (!response.ok) {
        throw new Error("Invalid or expired token");
      }

      const data = await response.json();
      const formattedData: Documentation = {
        request_id: data.request_id,
        documents: data.documents,
      };

      setDocumentation(formattedData);
      setIsValid(true);
    } catch (error) {
      setIsValid(false);
      setError((error as Error).message);
    }
  };

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setUploadSuccess(null);
    setUploadError(null);

    const formData = new FormData(e.currentTarget);

    try {
      const response = await fetch("https://ts.goncalomiranda.dev/request-documentation/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "An error occurred while uploading.");
      }

      setUploadSuccess(data.message);
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

  if (isValid === false) {
    return (
      <div className="bg-dark text-secondary px-4 py-5 text-center" id="mainDivDocumentation">
        <div className="py-5">
          <h1 className="display-5 fw-bold text-white">Upload Documents</h1>
          <div className="col-lg-6 mx-auto">
            <p className="fs-5 mb-4">
              Upload required documents securely and efficiently. Select files, provide optional details, and submit them for processing—all in a user-friendly interface.
            </p>
            <p className="text-info" style={{display: "none"}}>{error || "Documentation Unavailable"}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!documentation) {
    return <div className="text-center text-light">Loading...</div>;
  }

  return (
    <main>
      <div className="bg-dark text-secondary px-4 py-5 text-center" id="mainDivDocumentation">
        <div className="py-5">
          <h1 className="display-5 fw-bold text-white">Upload Documents</h1>
          <div className="col-lg-6 mx-auto">
            <p className="fs-5 mb-4">
              Upload required documents securely and efficiently. Select files, provide optional details, and submit them for processing—all in a user-friendly interface.
            </p>
          </div>

          {/* Hide this section if token is missing or after successful submission */}
          {token && !uploadSuccess && (
            <div id="requiredDocumentsDiv">
              <h2 className="mb-4">Required Documents</h2>
              <form onSubmit={handleUpload} encType="multipart/form-data">
                <input type="hidden" name="request_id" value={documentation.request_id} />
                <div className="row justify-content-center bg-dark text-light py-4" id="documentationList">
                  {documentation.documents.map((doc, index) => (
                    <div className="col-md-8" key={doc.key}>
                      <div className="card border-info mb-3 bg-dark text-light">
                        <div className="card-header bg-dark text-info">
                          <strong>{doc.value}</strong>
                        </div>
                        <div className="card-body">
                          <p className="card-text">Quantity Required: {doc.quantity}</p>
                          {[...Array(doc.quantity)].map((_, i) => (
                            <div className="mb-3" key={i}>
                              <label htmlFor={`upload_${index}_${i}`} className="form-label">
                                Upload File {i + 1}
                              </label>
                              <input
                                type="file"
                                className="form-control"
                                id={`upload_${index}_${i}`}
                                name={`documents[${doc.key}][${i}]`}
                                required
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-center">
                  <button type="submit" className="btn btn-outline-light btn-lg px-4" disabled={loading}>
                    {loading ? (
                      <>
                        <span className="spinner-grow spinner-grow-sm me-2" role="status" />
                        Uploading...
                      </>
                    ) : (
                      "Submit Documents"
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Success Modal */}
      {uploadSuccess && (
        <div className="modal fade show d-block" tabIndex={-1} role="dialog">
          <div className="modal-dialog">
            <div className="modal-content bg-dark text-light">
              <div className="modal-header">
                <h5 className="modal-title">Success</h5>
                <button type="button" className="btn-close" onClick={handleSuccessClose}></button>
              </div>
              <div className="modal-body">{uploadSuccess}</div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-light" onClick={handleSuccessClose}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {uploadError && (
        <div className="modal fade show d-block" tabIndex={-1} role="dialog">
          <div className="modal-dialog">
            <div className="modal-content bg-dark text-light">
              <div className="modal-header">
                <h5 className="modal-title">Error</h5>
                <button type="button" className="btn-close" onClick={() => setUploadError(null)}></button>
              </div>
              <div className="modal-body">{uploadError}</div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-light" onClick={() => setUploadError(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default UploadPage;
