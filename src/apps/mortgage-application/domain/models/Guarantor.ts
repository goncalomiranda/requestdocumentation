// Domain model for Guarantor
interface GuarantorData {
    name: string;
    dateOfBirth?: string;
    responsibilities?: string;
    maritalStatus?: string;
    dependents?: number;
    incomes?: number;
    employmentStatus?: string;
}

class Guarantor {
    name: string;
    dateOfBirth?: string;
    responsibilities?: string;
    maritalStatus?: string;
    dependents?: number;
    incomes?: number;
    employmentStatus?: string;

    constructor(data: GuarantorData) {
        this.name = data.name;
        this.dateOfBirth = data.dateOfBirth;
        this.responsibilities = data.responsibilities;
        this.maritalStatus = data.maritalStatus;
        this.dependents = data.dependents;
        this.incomes = data.incomes;
        this.employmentStatus = data.employmentStatus;
    }
}

export { Guarantor, GuarantorData };