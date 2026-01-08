
export interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: number;
}

export interface MetricData {
  label: string;
  value: number;
  trend: 'up' | 'down' | 'stable';
}

export interface User {
  id: string;
  username: string;
  user_id: string;
  email_id: string;
  mobile_no?: string;
  firm_name?: string | null;
  gstn?: string | null;
  status: 'online' | 'away' | 'offline';
}

export interface AppState {
  messages: Message[];
  metrics: MetricData[];
  users: User[];
  isConnected: boolean;
  currentUser: User | null;
}

export type ActiveView = string;

export type ClientStatus = 'Active Filing' | 'Case-by-Case' | 'Inactive (Temporary)' | 'Inactive (Closed)' | 'Active' | 'Inactive';
export type GstStatus = 'Active' | 'Suspended' | 'Cancelled';
export type GstRegType = 'Regular' | 'Composition';
export type GstFilingFreq = 'Monthly' | 'Quarterly';
export type ConstitutionType = 'Proprietorship' | 'Partnership' | 'HUF' | 'Company' | 'Trust' | 'Other';
export type JurisdictionType = 'Center' | 'State';
export type ClientService = 'IT Return' | 'Audit' | 'Notice handling' | 'MSME' | 'Food License';

export interface Stakeholder {
  id: string;
  name: string;
  mobile: string;
  pan: string;
}

export interface GSTProfile {
  gstin: string;
  pan?: string;
  username: string;
  password?: string;
  gstStatus: GstStatus;
  regDate: string;
  cancelDate?: string;
  regType: GstRegType;
  filingFreq: GstFilingFreq;
  constitution: ConstitutionType;
  stakeholders: Stakeholder[];
  accountantName?: string;
  accountantMobile?: string;
  certificateUrl?: string;
  address?: string;
  jurisdictionType?: JurisdictionType;
  sector?: string;
  range?: string;
}

export interface ITProfile {
  pan: string;
  category: string;
  username: string;
  password?: string;
  fatherName?: string;
  incomeType?: 'Business' | 'Salary' | 'Both';
  companyName?: string;
}

export interface BankDetails {
  bankName: string;
  accountNo: string;
  ifsc: string;
}

export interface Client {
  id: string;
  legalName: string;
  tradeName: string;
  mobile: string;
  email: string;
  status: ClientStatus;
  gstProfile?: GSTProfile;
  itProfile?: ITProfile;
  services?: ClientService[];
  bankDetails?: BankDetails;
  remarks?: string;
  createdAt: number;
}

// Administration Types
export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  taxRate: number; // 0, 5, 12, 18, 28
  amount: number;
}

export interface InvoiceRecord {
  id: string;
  clientId: string;
  clientName: string;
  isMiscClient?: boolean;
  miscMobile?: string;
  miscAddress?: string;
  invoiceNo: string;
  date: string;
  dueDate: string;
  items: InvoiceLineItem[];
  subTotal: number;
  totalTax: number;
  totalAmount: number;
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled';
  paymentMode?: 'Cash' | 'Bank Transfer' | 'Cheque' | 'UPI' | 'Online';
  paymentDate?: string;
  chequeNo?: string;
  createdAt: number;
}

export interface InvoiceSettings {
  firmName: string;
  firmAddress: string;
  firmMobile: string;
  firmEmail: string;
  firmGstin: string;
  firmLogo?: string; // Base64
  firmSignature?: string; // Base64
  bankName: string;
  accountNo: string;
  ifsc: string;
  upiId: string;
  invoicePrefix: string;
  terms: string;
  isGstEnabled: boolean;
}

export interface PaymentRecord {
  id: string;
  clientId: string;
  clientName: string;
  invoiceNo?: string;
  invoiceDate?: string;
  date: string; // Payment Date
  amount: number;
  mode: 'Cash' | 'Bank Transfer' | 'Cheque' | 'UPI' | 'Online';
  referenceNo?: string;
  chequeNo?: string;
  createdAt: number;
  originalItems?: InvoiceLineItem[];
}

export interface ReminderRecord {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  category: 'GST' | 'IT' | 'Audit' | 'General';
  priority: 'High' | 'Medium' | 'Low';
  isCompleted: boolean;
  createdAt: number;
}

export type LitigationCategory = 'Notice' | 'Appeal' | 'Tribunal' | 'HighCourt';
export type LitigationStatus = 'Pending' | 'Filed' | 'Drop' | 'Demand';

export interface LitigationRecord {
  id: string;
  clientId: string;
  clientName: string;
  category: LitigationCategory;
  status: LitigationStatus;
  referenceNo: string;
  section: string;
  taxPeriod?: string;
  issuedDate: string;
  dueDate: string;
  filedDate?: string;
  hearingDate?: string;
  orderDate?: string;
  officerName?: string;
  amountInvolved?: number;
  remarks?: string;
  createdAt: number;
  previousNoticeRef?: string;
  previousNoticeSection?: string;
  isReissued?: boolean;
  isDemandPaid?: boolean;
}

export type GSTRegistrationType = 'New Registration' | 'Amendment' | 'Cancellation' | 'Surrender';
export type GSTRegistrationStatus = 'Pending' | 'Data Requested' | 'In Progress' | 'ARN Generated' | 'Completed' | 'Rejected';

export interface GSTRegistrationRecord {
  id: string;
  clientName: string;
  mobile: string;
  appType: GSTRegistrationType;
  status: GSTRegistrationStatus;
  appDate: string;
  arn: string;
  completionDate?: string;
  remarks?: string;
  createdAt: number;
}

export type FoodLicenseType = 'FSSAI Basic Registration' | 'State License' | 'Central License';
export type FoodLicenseStatus = 'Pending' | 'Data Requested' | 'In Progress' | 'Applied' | 'Completed' | 'Rejected';

export interface FoodLicenseRecord {
  id: string;
  clientName: string;
  mobile: string;
  licenseType: FoodLicenseType;
  status: FoodLicenseStatus;
  appDate: string;
  licenseNo: string;
  expiryDate?: string;
  remarks?: string;
  createdAt: number;
}

export type MSMERegistrationStatus = 'Pending' | 'Data Requested' | 'In Progress' | 'Completed' | 'Failed';

export interface MSMERegistrationRecord {
  id: string;
  clientName: string;
  mobile: string;
  regType: 'Udyam Registration';
  status: MSMERegistrationStatus;
  appDate: string;
  udyamNumber: string;
  remarks?: string;
  createdAt: number;
}

export type MiscWorkStatus = 'Pending' | 'In Progress' | 'Completed' | 'On Hold';

export interface MiscWorkRecord {
  id: string;
  clientName: string;
  mobile: string;
  description: string;
  status: MiscWorkStatus;
  assignedTo: string;
  startDate: string;
  completionDate?: string;
  remarks?: string;
  createdAt: number;
}
