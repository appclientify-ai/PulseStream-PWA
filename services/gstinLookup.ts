import { toast } from 'sonner';

export interface GstinDetails {
  gstin: string;
  legalName: string;
  tradeName: string;
  pan: string;
  gstStatus: 'Active' | 'Cancelled' | 'Suspended' | 'Inactive';
  regDate: string;
  constitution: string;
  regType: string;
  address: string;
  state: string;
  jurisdiction: string;
  taxpayerType: string;
  isLiveFetched: boolean;
}

const STATE_CODES: Record<string, string> = {
  '01': 'Jammu & Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '25': 'Daman & Diu',
  '26': 'Dadra & Nagar Haveli',
  '27': 'Maharashtra',
  '28': 'Andhra Pradesh (Old)',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman & Nicobar Islands',
  '36': 'Telangana',
  '37': 'Andhra Pradesh (New)',
  '38': 'Ladakh'
};

const ENTITY_TYPE_MAP: Record<string, string> = {
  'C': 'Company',
  'P': 'Proprietorship',
  'F': 'Partnership',
  'A': 'Association of Persons (AOP)',
  'H': 'Hindu Undivided Family (HUF)',
  'T': 'Trust',
  'G': 'Government Department',
  'L': 'Local Authority',
  'J': 'Artificial Juridical Person'
};

/**
 * Validates 15-character Indian GSTIN format
 */
export function validateGstinFormat(gstin: string): boolean {
  if (!gstin) return false;
  const clean = gstin.trim().toUpperCase();
  const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return regex.test(clean);
}

/**
 * Decodes state, PAN, and constitution directly from GSTIN structure
 */
export function decodeGstinStructure(gstinStr: string) {
  const clean = gstinStr.trim().toUpperCase();
  const stateCode = clean.substring(0, 2);
  const stateName = STATE_CODES[stateCode] || 'India';
  const pan = clean.length >= 12 ? clean.substring(2, 12) : '';
  const entityChar = pan.length === 10 ? pan.charAt(3) : 'P';
  const constitution = ENTITY_TYPE_MAP[entityChar] || 'Proprietorship';

  return {
    stateCode,
    stateName,
    pan,
    constitution
  };
}

/**
 * Fetches GSTIN details from public GST APIs or provides official portal deep-link
 */
export async function fetchGstinPublicDetails(gstinInput: string): Promise<GstinDetails> {
  const cleanGstin = gstinInput.trim().toUpperCase();

  if (cleanGstin.length !== 15) {
    throw new Error('GSTIN must be exactly 15 characters long.');
  }

  if (!validateGstinFormat(cleanGstin)) {
    throw new Error('Invalid GSTIN format. Example format: 27AAPCS1429B1Z0');
  }

  const decoded = decodeGstinStructure(cleanGstin);

  // Check for custom GSP API Key in environment or storage
  const customApiKey = import.meta.env.VITE_GST_API_KEY || localStorage.getItem('CUSTOM_GST_API_KEY');

  if (customApiKey) {
    try {
      const response = await fetch(`https://sheet.gstincheck.co.in/check/${customApiKey}/${cleanGstin}`);
      if (response.ok) {
        const result = await response.json();
        if (result && result.flag && result.data) {
          const d = result.data;
          const legalName = d.lpr || d.tradeNam || '';
          const tradeName = d.tradeNam || d.lpr || legalName;
          const rawAddr = d.pradr?.addr;
          let formattedAddr = '';
          if (rawAddr) {
            formattedAddr = [rawAddr.bno, rawAddr.bnm, rawAddr.st, rawAddr.loc, rawAddr.dst, rawAddr.stcd, rawAddr.pncd]
              .filter(Boolean)
              .join(', ');
          }

          return {
            gstin: cleanGstin,
            legalName,
            tradeName,
            pan: decoded.pan,
            gstStatus: (d.sts === 'Active' || d.rgdt) ? 'Active' : 'Cancelled',
            regDate: d.rgdt || '',
            constitution: d.ctb || decoded.constitution,
            regType: d.dty || 'Regular',
            address: formattedAddr || `${decoded.stateName}, India`,
            state: decoded.stateName,
            jurisdiction: d.stj || `${decoded.stateName} State Jurisdiction`,
            taxpayerType: d.dty || 'Regular Taxpayer',
            isLiveFetched: true
          };
        }
      }
    } catch (err) {
      console.warn('Custom GST API error:', err);
    }
  }

  // If no API key or API key call didn't return data, return decoded structure WITHOUT fake names
  return {
    gstin: cleanGstin,
    legalName: '',
    tradeName: '',
    pan: decoded.pan,
    gstStatus: 'Active',
    regDate: '',
    constitution: decoded.constitution,
    regType: 'Regular',
    address: `${decoded.stateName}, India`,
    state: decoded.stateName,
    jurisdiction: `${decoded.stateName} Jurisdiction`,
    taxpayerType: 'Regular Taxpayer',
    isLiveFetched: false
  };
}
