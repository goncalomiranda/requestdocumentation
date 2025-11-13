import { Client, ClientData } from './Client';
import { Guarantor, GuarantorData } from './Guarantor';

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
interface ApplicationForm {
  type: string
  customer: Customer;
  documents: DocumentRequest[];
}

// Domain model for MortgageApplication data
interface MortgageApplicationData {
  consultant: string;
  purchaseValue: number;
  financingAmount: number;
  otherFinancingAmount?: number;
  ownCapital: number;
  rents?: number;
  banks?: string;
  comments?: string;
  guarantors?: GuarantorData[];
  proponents?: ClientData[];
}

class MortgageApplication {
  purchaseValue: number;
  financingAmount: number;
  otherFinancingAmount?: number;
  ownCapital: number;
  rents?: number;
  banks?: string;
  comments?: string;
  guarantors: Guarantor[];
  proponents: Client[];

  constructor(data: MortgageApplicationData) {
    this.purchaseValue = data.purchaseValue;
    this.financingAmount = data.financingAmount;
    this.otherFinancingAmount = data.otherFinancingAmount;
    this.ownCapital = data.ownCapital;
    this.rents = data.rents;
    this.banks = data.banks;
    this.comments = data.comments;
    this.guarantors = data.guarantors && Array.isArray(data.guarantors)
      ? data.guarantors.map((guarantor) => new Guarantor(guarantor))
      : [];
    this.proponents = data.proponents && Array.isArray(data.proponents)
      ? data.proponents.map((proponent) => new Client(proponent))
      : [];
  }
}

export { Customer, DocumentRequest, ApplicationForm, MortgageApplication, MortgageApplicationData };
