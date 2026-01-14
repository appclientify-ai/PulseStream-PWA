
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

/**
 * Fix: Defined View enum for unified navigation across the application.
 */
export enum View {
  Dashboard = 'dashboard',
  GstClientDetails = 'gst-portfolio',
  ItClientDetails = 'it-portfolio',
  GstRegularMonthly = 'compliance-monthly',
  GstRegularQuarterly = 'compliance-quarterly',
  GstCompositionReturn = 'compliance-composition',
  Gstr4Annual = 'compliance-gstr4',
  Gstr9Annual = 'compliance-gstr9',
  IncomeTaxReturn = 'compliance-itr',
  Audit = 'compliance-taxaudit',
  BalanceSheet = 'balance-sheet',
  GstNoticePendingReply = 'lit-notice-pending',
  GstAppealPending = 'lit-appeal-pending',
  GstTribunalPending = 'lit-gstat-pending',
  HighCourtAppealPending = 'lit-hc-pending',
  GstRegistration = 'misc-gst-reg',
  FoodLicenses = 'misc-food-lic',
  MsmeRegistration = 'misc-msme',
  MiscellaneousWork = 'misc-work',
  DueDateReminder = 'reminders',
  ReminderMessages = 'messenger',
  PaymentDetails = 'admin-payments',
  Settings = 'settings'
}

/**
 * Fix: Added Audit and BalanceSheet status enums and related types.
 */
export enum AuditType {
  TAX_AUDIT_44AB = 'Tax Audit u/s 44AB',
  COMPANY_AUDIT = 'Statutory Company Audit',
  TRUST_AUDIT = 'Trust / NGO Audit',
  GST_AUDIT = 'GST Audit / Reconciliation',
  OTHER = 'Other Audit'
}

export enum AuditStatus {
  PENDING = 'Pending',
  DATA_REQUESTED = 'Data Requested',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed'
}

export enum BalanceSheetStatus {
  PENDING = 'Pending',
  DATA_RECEIVED = 'Data Received',
  IN_PROGRESS = 'In Progress',
  FINALIZED = 'Finalized'
}

export interface PdfDocument {
  name: string;
  dataUrl: string;
}

// Added 'Active' to ClientStatus to support both GST and IT specific status designations
export type ClientStatus = 'Active Filing' | 'Active' | 'Litigation' | 'Inactive';
export type GstStatus = 'Active' | 'Suspended' | 'Closed';
export type GstRegType = 'Regular' | 'Composition';
export type GstFilingFreq = 'Monthly' | 'Quarterly';

/**
 * Fix: Added TaxpayerType and FilingFrequency type aliases for compatibility with Dashboard components.
 */
export type TaxpayerType = GstRegType;
export type FilingFrequency = GstFilingFreq;

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
  ewayUsername?: string;
  ewayPassword?: string;
  gstatUsername?: string;
  gstatPassword?: string;
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
  constitution?: ConstitutionType;
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
  /**
   * Fix: Added audits and balanceSheets properties to Client interface for extended tracking modules.
   */
  audits?: Record<string, Record<string, {
    status: AuditStatus;
    dueDate?: string;
    completionDate?: string;
    assignedTo?: string;
    remarks?: string;
  }>>;
  balanceSheets?: Record<string, {
    status: BalanceSheetStatus;
    finalizationDate?: string;
    remarks?: string;
    documents?: PdfDocument[];
  }>;
  // Compatibility helpers
  gstDetails?: any;
  itDetails?: any;
  clientStatus?: ClientStatus;
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
