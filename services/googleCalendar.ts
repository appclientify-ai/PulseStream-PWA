import { triggerInAppNotification } from '../components/NotificationCenter';
import { toast } from 'sonner';

const CLIENT_ID = '780811365983-mcg3jsqjlns18j8gtqjn16e7ql44ijij.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/userinfo.email';

export interface GoogleCalendarPreferences {
  reminders1DayBefore: boolean;
  reminders3DaysBefore: boolean;
  reminders7DaysBefore: boolean;
  timeZone: string;
  autoSyncStatutory: boolean;
}

export const DEFAULT_CALENDAR_PREFS: GoogleCalendarPreferences = {
  reminders1DayBefore: true,
  reminders3DaysBefore: true,
  reminders7DaysBefore: false,
  timeZone: 'Asia/Kolkata',
  autoSyncStatutory: false
};

const PREFS_STORAGE_KEY = 'clientify_google_calendar_prefs_v1';
const TOKEN_STORAGE_KEY = 'clientify_google_access_token';
const ACCOUNT_EMAIL_STORAGE_KEY = 'clientify_google_account_email';
const SYNCED_EVENTS_LOG_KEY = 'clientify_google_synced_event_ids_v1';

export function getCalendarPreferences(): GoogleCalendarPreferences {
  try {
    const raw = localStorage.getItem(PREFS_STORAGE_KEY);
    if (raw) return { ...DEFAULT_CALENDAR_PREFS, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Failed to parse calendar preferences:', e);
  }
  return DEFAULT_CALENDAR_PREFS;
}

export function saveCalendarPreferences(prefs: Partial<GoogleCalendarPreferences>) {
  const current = getCalendarPreferences();
  const updated = { ...current, ...prefs };
  localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function getGoogleAccessToken(): string | null {
  return sessionStorage.getItem(TOKEN_STORAGE_KEY) || localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function getGoogleAccountEmail(): string | null {
  return localStorage.getItem(ACCOUNT_EMAIL_STORAGE_KEY);
}

export function isGoogleCalendarConnected(): boolean {
  return !!getGoogleAccessToken();
}

export function disconnectGoogleCalendar(): void {
  sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(ACCOUNT_EMAIL_STORAGE_KEY);
  toast.info('Google Calendar disconnected.');
}

export function getSyncedEventIds(): string[] {
  try {
    const raw = localStorage.getItem(SYNCED_EVENTS_LOG_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return [];
}

export function markEventAsSynced(id: string) {
  const synced = getSyncedEventIds();
  if (!synced.includes(id)) {
    synced.push(id);
    localStorage.setItem(SYNCED_EVENTS_LOG_KEY, JSON.stringify(synced));
  }
}

// Dynamically load Google Identity Services script
export function loadGsiScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).google?.accounts?.oauth2) {
      resolve();
      return;
    }
    const existing = document.getElementById('google-gsi-script');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      return;
    }
    const script = document.createElement('script');
    script.id = 'google-gsi-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services SDK.'));
    document.head.appendChild(script);
  });
}

// Prompt OAuth popup to acquire Access Token and fetch user email
export async function connectGoogleAccount(): Promise<string> {
  await loadGsiScript();

  if (!(window as any).google?.accounts?.oauth2) {
    throw new Error('Google Identity Services script failed to initialize.');
  }

  return new Promise((resolve, reject) => {
    const oauth2 = (window as any).google.accounts.oauth2;
    const tokenClient = oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: async (response: any) => {
        if (response.error) {
          const errMsg = response.error_description || response.error || 'Authentication denied.';
          triggerInAppNotification('❌ Google Auth Failed', errMsg, 'urgent');
          reject(new Error(errMsg));
          return;
        }

        if (response.access_token) {
          sessionStorage.setItem(TOKEN_STORAGE_KEY, response.access_token);
          localStorage.setItem(TOKEN_STORAGE_KEY, response.access_token);

          // Fetch user email
          try {
            const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${response.access_token}` },
            });
            if (userInfoRes.ok) {
              const userData = await userInfoRes.json();
              if (userData.email) {
                localStorage.setItem(ACCOUNT_EMAIL_STORAGE_KEY, userData.email);
              }
            }
          } catch (err) {
            console.warn('Could not fetch user profile email:', err);
          }

          triggerInAppNotification(
            '✅ Google Calendar Linked',
            `Connected securely to Google Calendar. Ready to schedule deadlines.`,
            'success'
          );
          resolve(response.access_token);
        } else {
          reject(new Error('No access token received from Google.'));
        }
      },
    });

    tokenClient.requestAccessToken({ prompt: 'select_account' });
  });
}

interface CalendarEventPayload {
  summary: string;
  description: string;
  start: { date: string; timeZone: string };
  end: { date: string; timeZone: string };
  reminders: {
    useDefault: boolean;
    overrides: Array<{ method: string; minutes: number }>;
  };
}

// Single Deadline Sync
export async function syncDeadlineToGoogleCalendar(
  title: string,
  body: string,
  dateString: string,
  eventId?: string
): Promise<boolean> {
  try {
    let token = getGoogleAccessToken();
    if (!token) {
      token = await connectGoogleAccount();
    }

    await createCalendarEvent(token, title, body, dateString);
    if (eventId) {
      markEventAsSynced(eventId);
    }
    return true;
  } catch (error: any) {
    console.error('Google Calendar Sync Error:', error);
    toast.error(error.message || 'Failed to sync to Google Calendar');
    return false;
  }
}

async function createCalendarEvent(
  accessToken: string,
  title: string,
  body: string,
  dateString: string
): Promise<void> {
  const formattedDate = new Date(dateString);
  if (isNaN(formattedDate.getTime())) {
    throw new Error('Invalid deadline date provided.');
  }

  const prefs = getCalendarPreferences();
  const dateOnlyStr = formattedDate.toISOString().split('T')[0];

  const reminderOverrides: Array<{ method: string; minutes: number }> = [];
  if (prefs.reminders1DayBefore) {
    reminderOverrides.push({ method: 'popup', minutes: 24 * 60 });
  }
  if (prefs.reminders3DaysBefore) {
    reminderOverrides.push({ method: 'popup', minutes: 3 * 24 * 60 });
  }
  if (prefs.reminders7DaysBefore) {
    reminderOverrides.push({ method: 'popup', minutes: 7 * 24 * 60 });
  }
  if (reminderOverrides.length === 0) {
    reminderOverrides.push({ method: 'popup', minutes: 24 * 60 });
  }

  const nextDay = new Date(formattedDate);
  nextDay.setDate(nextDay.getDate() + 1);
  const endDayStr = nextDay.toISOString().split('T')[0];

  const event: CalendarEventPayload = {
    summary: `📆 Clientify Compliance: ${title}`,
    description: `${body}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\nSynced securely from Clientify Legal Tech Vault.\nPractice Management & Compliance Hub.`,
    start: {
      date: dateOnlyStr,
      timeZone: prefs.timeZone || 'Asia/Kolkata',
    },
    end: {
      date: endDayStr,
      timeZone: prefs.timeZone || 'Asia/Kolkata',
    },
    reminders: {
      useDefault: false,
      overrides: reminderOverrides,
    },
  };

  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });

  if (response.status === 401) {
    disconnectGoogleCalendar();
    throw new Error('Google OAuth session expired. Please reconnect your Google account.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Google Calendar API error.');
  }

  toast.success(`📅 Synced "${title}" to Google Calendar!`);
  triggerInAppNotification(
    '📅 Google Calendar Synced!',
    `Successfully added "${title}" deadline (${dateOnlyStr}) with automated alerts.`,
    'success'
  );
}

export interface DeadlineSyncItem {
  id: string;
  title: string;
  client?: string;
  category?: string;
  date: string;
}

// Batch Sync Multiple Deadlines
export async function batchSyncDeadlinesToGoogleCalendar(
  items: DeadlineSyncItem[],
  onProgress?: (current: number, total: number) => void
): Promise<{ successCount: number; failedCount: number }> {
  let token = getGoogleAccessToken();
  if (!token) {
    token = await connectGoogleAccount();
  }

  let successCount = 0;
  let failedCount = 0;
  const total = items.length;

  for (let i = 0; i < total; i++) {
    const item = items[i];
    if (onProgress) onProgress(i + 1, total);

    try {
      const body = `Compliance Item: ${item.title}\nEntity/Client: ${item.client || 'General Firm Portfolio'}\nModule Category: ${item.category || 'General Compliance'}\nDue Date: ${item.date}`;
      await createCalendarEvent(token, item.title, body, item.date);
      markEventAsSynced(item.id);
      successCount++;
    } catch (e: any) {
      console.error(`Failed to sync item ${item.title}:`, e);
      failedCount++;
      // If token expired, abort and notify
      if (e.message?.includes('expired') || e.message?.includes('OAuth')) {
        break;
      }
    }
  }

  return { successCount, failedCount };
}
