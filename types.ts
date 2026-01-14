
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

// Added View enum to support internal navigation in Sidebar and Dashboard components
export enum View {
  Dashboard = 'dashboard',
  GstClientDetails = 'gst-clients',
  ItClientDetails = 'it-clients',
  GstRegularMonthly = 'gst-monthly',
  GstRegularQuarterly = 'gst-quarterly',
  GstCompositionReturn = 'gst-composition',
  GstNoticePendingReply = 'gst-notices',
  GstAppealPending = 'gst-appeals',
  GstTribunalPending = 'gst-tribunal-pending',
  HighCourtAppealPending = 'hc-appeal-pending',
  Gstr4Annual = 'gstr-4-annual',
  Gstr9Annual = 'gstr-9-annual',
  IncomeTaxReturn = 'it-return',
  Audit = 'audit',
  BalanceSheet = 'balance-sheet',
  GstRegistration = 'gst-reg',
  FoodLicenses = 'food-lic',
  MsmeRegistration = 'msme-reg',
  MiscellaneousWork = 'misc-work',
  DueDateReminder = 'reminders',
  ReminderMessages = 'reminder-messages',
  PaymentDetails = 'payments',
  Settings = 'settings',
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
  // Added missing properties required by Sidebar component
  fullName: string;
  role: string;
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

/* Fix: Consolidated GST Registration related types into a single Enum to avoid merging errors */
export type GSTRegistrationType = 'New Registration' | 'Amendment' | 'Cancellation';

export enum GstRegistrationStatus {
  PENDING = 'Pending',
  DATA_REQUESTED = 'Data Requested',
  IN_PROGRESS = 'In Progress',
  ARN_GENERATED = 'ARN Generated',
  COMPLETED = 'Completed',
  REJECTED = 'Rejected'
}

export interface GSTRegistrationRecord {
  id: string;
  clientName: string;
  mobile: string;
  appType: GSTRegistrationType;
  status: GstRegistrationStatus;
  appDate: string;
  arn: string;
  completionDate?: string;
  remarks?: string;
}

/* Fix: Consolidated Food License related types into a single Enum */
export type FoodLicenseType = 'FSSAI Basic Registration' | 'State License' | 'Central License';

export enum FoodLicenseStatus {
  PENDING = 'Pending',
  APPLIED = 'Applied',
  COMPLETED = 'Completed',
  REJECTED = 'Rejected'
}

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

/* Fix: Consolidated MSME Registration related types into a single Enum */
export enum MsmeRegistrationStatus {
  PENDING = 'Pending',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
  FAILED = 'Failed'
}

export interface MSMERegistrationRecord {
  id: string;
  clientName: string;
  mobile: string;
  regType: string;
  status: MsmeRegistrationStatus;
  appDate: string;
  udyamNumber: string;
  remarks?: string;
}

/* Fix: Consolidated Miscellaneous Work related types into a single Enum */
export enum MiscWorkStatus {
  PENDING = 'Pending',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
  ON_HOLD = 'On Hold'
}

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

// Added additional enums required for Dashboard components to compile correctly
export enum GstReturnStatus { FILED = 'Filed', PENDING = 'Pending' }
export enum ItrFilingStatus { FILED = 'Filed', PENDING = 'Pending', NOT_APPLICABLE = 'Not Applicable' }
export enum NoticeReplyStatus { PENDING = 'Pending', OVERDUE = 'Overdue', FILED = 'Filed' }
export enum FilingFrequency { MONTHLY = 'Monthly', QUARTERLY = 'Quarterly' }
export enum TaxpayerType { REGULAR = 'Regular', COMPOSITION = 'Composition' }
export enum AppealStatus { PENDING = 'Pending', FILED = 'Filed' }
export enum TribunalStatus { PENDING = 'Pending', FILED = 'Filed' }
export enum HighCourtStatus { PENDING = 'Pending', FILED = 'Filed' }
export enum AuditStatus { COMPLETED = 'Completed', PENDING = 'Pending' }
export enum BalanceSheetStatus { FINALIZED = 'Finalized', PENDING = 'Pending' }
export enum OrderStatus { ORDER_DROP = 'Order Drop', DEMAND_ORDER = 'Demand Order' }
export enum AppealDecisionStatus { DEMAND_DROP = 'Demand Drop', DEMAND = 'Demand' }
export enum TribunalDecisionStatus { DEMAND_DROP = 'Demand Drop', DEMAND = 'Demand' }
export enum HighCourtDecisionStatus { DEMAND_DROP = 'Demand Drop', DEMAND = 'Demand' }
