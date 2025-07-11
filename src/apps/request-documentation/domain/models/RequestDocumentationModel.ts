// Domain model for the customer object
interface Customer {
  id: string;
  name: string;
  email: string;
  languagePreference: string;
  folder: string;
}

// Domain model for individual document requests
interface DocumentRequest {
  key: string;
  quantity: number;
}

// Domain model for the entire request body
interface DocumentationRequest {
  customer: Customer;
  documents: DocumentRequest[];
}

export { Customer, DocumentRequest, DocumentationRequest };
