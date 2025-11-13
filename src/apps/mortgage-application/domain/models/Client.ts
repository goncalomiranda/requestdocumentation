// Domain model for Client (Proponent)
interface ClientData {
    name: string;
    phoneNumber?: string;
    dateOfBirth?: string;
    email?: string;
    responsibilities?: string;
    maritalStatus?: string;
    dependents?: number;
    incomes?: number;
    employmentStatus?: string;
}

class Client {
    name: string;
    phoneNumber?: string;
    dateOfBirth?: string;
    email?: string;
    responsibilities?: string;
    maritalStatus?: string;
    dependents?: number;
    incomes?: number;
    employmentStatus?: string;

    constructor(data: ClientData) {
        this.name = data.name;
        this.phoneNumber = data.phoneNumber;
        this.dateOfBirth = data.dateOfBirth;
        this.email = data.email;
        this.responsibilities = data.responsibilities;
        this.maritalStatus = data.maritalStatus;
        this.dependents = data.dependents;
        this.incomes = data.incomes;
        this.employmentStatus = data.employmentStatus;
    }
}

export { Client, ClientData };