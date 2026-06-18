
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

export interface UISettings {
  fontSize: number; // in px, default 16
  fontStyle: 'sans' | 'serif' | 'mono';
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
  avatar?: string; // base64 string for DP
  uiSettings?: UISettings;
}

export type ActiveView = string;

export type ClientStatus = 'Active' | 'Litigation' | 'Inactive' | 'Active Filing';
export type GstStatus = 'Active' | 'Suspended' | 'Closed';
export type GstRegType = 'Regular' | 'Composition';
export type GstFilingFreq = 'Monthly' | 'Quarterly';
export type ConstitutionType = 'Proprietorship' | 'Partnership' | 'HUF' | 'Company' | 'Trust' | 'Society' | 'Other';
export type JurisdictionType = 'Center' | 'State';

export interface Stakeholder {
  id: string;
  name: string;
  mobile: string;
  pan: string;
  itPassword?: string;
  address?: string;
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
  address?: string;
  jurisdictionType?: JurisdictionType;
  sector?: string;
  range?: string;
  ewayBillId?: string;
  ewayBillPass?: string;
  gstatId?: string;
  gstatPass?: string;
}

export type NatureOfWork = 'Salaried' | 'Business' | 'Profession' | 'House Property' | 'Capital Gain' | 'Others';

export interface ITProfile {
  pan: string;
  category: string;
  username: string;
  password?: string;
  fatherName?: string;
  dob?: string;
  natureOfWork?: NatureOfWork;
  employmentType?: string;
  businessName?: string;
  advisoryWork?: {
    itrFiling: boolean;
    taxAudit: boolean;
    balanceSheet: boolean;
    appeals: boolean;
  };
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
  bankDetails?: BankDetails;
  remarks?: string;
  createdAt: number;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  taxRate: number;
  amount: number;
}

export interface InvoiceRecord {
  id: string;
  clientId: string;
  clientName: string;
  invoiceNo: string;
  date: string;
  dueDate: string;
  items: InvoiceLineItem[];
  subTotal: number;
  totalTax: number;
  totalAmount: number;
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled';
  paymentMode?: string;
  paymentDate?: string;
  miscMobile?: string;
  miscAddress?: string;
  isMiscClient?: boolean;
}

export interface InvoiceSettings {
  firmName: string;
  firmAddress: string;
  firmMobile: string;
  firmEmail: string;
  firmGstin: string;
  bankName: string;
  accountNo: string;
  ifsc: string;
  upiId: string;
  invoicePrefix: string;
  terms: string;
  isGstEnabled: boolean;
  firmLogo?: string;
  firmSignature?: string;
  whatsappNumber?: string;
}

export interface PaymentRecord {
  id: string;
  clientId: string;
  clientName: string;
  invoiceNo?: string;
  invoiceDate?: string;
  date: string;
  amount: number;
  mode: 'Cash' | 'Bank Transfer' | 'Cheque' | 'UPI' | 'Online';
  referenceNo?: string;
  originalItems?: InvoiceLineItem[];
  chequeNo?: string;
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
  replyReferenceNo?: string;
  orderDate?: string;
  remarks?: string;
  isReissued?: boolean;
  previousNoticeRef?: string;
  previousNoticeSection?: string;
  isDemandPaid?: boolean;
  hearingDate?: string;
}

export type GSTRegistrationType = 'New Registration' | 'Amendment' | 'Cancellation';
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
}

export type FoodLicenseType = 'FSSAI Basic Registration' | 'State License' | 'Central License';
export type FoodLicenseStatus = 'Pending' | 'Applied' | 'Completed' | 'Rejected';

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
}

export type MSMERegistrationStatus = 'Pending' | 'In Progress' | 'Completed' | 'Failed';

export interface MSMERegistrationRecord {
  id: string;
  clientName: string;
  mobile: string;
  regType: string;
  status: MSMERegistrationStatus;
  appDate: string;
  udyamNumber: string;
  remarks?: string;
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
}
