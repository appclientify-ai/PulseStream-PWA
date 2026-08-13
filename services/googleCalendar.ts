import { triggerInAppNotification } from '../components/NotificationCenter';

const CLIENT_ID = '780811365983-mcg3jsqjlns18j8gtqjn16e7ql44ijij.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/calendar.events';

interface GoogleCalendarEvent {
  summary: string;
  description: string;
  start: {
    date: string; // YYYY-MM-DD
    timeZone: string;
  };
  end: {
    date: string;
    timeZone: string;
  };
  reminders: {
    useDefault: boolean;
    overrides: Array<{ method: string; minutes: number }>;
  };
}

let tokenClient: any = null;

// Dynamically load Google Identity Services script
export function loadGsiScript(): Promise<void> {
  return new Promise((resolve) => {
    if ((window as any).google?.accounts?.oauth2) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      resolve();
    };
    document.head.appendChild(script);
  });
}

// Request Token and Sync Event
export async function syncDeadlineToGoogleCalendar(title: string, body: string, dateString: string) {
  try {
    await loadGsiScript();
    
    const token = sessionStorage.getItem('clientify_google_access_token');
    if (token) {
      await createCalendarEvent(token, title, body, dateString);
      return;
    }

    // Initialize Token Client
    if (!(window as any).google?.accounts?.oauth2) {
      throw new Error('Google Identity Services script failed to load.');
    }

    const oauth2 = (window as any).google.accounts.oauth2;
    tokenClient = oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: async (response: any) => {
        if (response.error) {
          triggerInAppNotification('❌ Google Auth Failed', response.error_description || 'Permission denied.', 'urgent');
          return;
        }
        
        if (response.access_token) {
          sessionStorage.setItem('clientify_google_access_token', response.access_token);
          await createCalendarEvent(response.access_token, title, body, dateString);
        }
      },
    });

    tokenClient.requestAccessToken({ prompt: 'consent' });

  } catch (error: any) {
    console.error('Google Calendar Sync Error:', error);
    triggerInAppNotification('❌ Calendar Sync Error', error.message || 'Failed to authenticate.', 'urgent');
  }
}

async function createCalendarEvent(accessToken: string, title: string, body: string, dateString: string) {
  try {
    const formattedDate = new Date(dateString);
    if (isNaN(formattedDate.getTime())) {
      throw new Error('Invalid deadline date provided.');
    }

    const dateOnlyStr = formattedDate.toISOString().split('T')[0];

    const event: GoogleCalendarEvent = {
      summary: `📆 Clientify Compliance: ${title}`,
      description: `${body}\n\nSynced automatically from Clientify Legal Tech Vault. Keep your practice compliance green.`,
      start: {
        date: dateOnlyStr,
        timeZone: 'Asia/Kolkata',
      },
      end: {
        date: dateOnlyStr, // All-day events end date is exclusive in Google Calendar API for some views, but simple same-day all day works or we can add 1 day
        timeZone: 'Asia/Kolkata',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 3 * 24 * 60 }, // 3 days before
        ],
      },
    };

    // Correcting end date to be exclusive for all-day events (dateString + 1 day)
    const nextDay = new Date(formattedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    event.end.date = nextDay.toISOString().split('T')[0];

    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    if (response.status === 401) {
      // Token expired, clear and retry
      sessionStorage.removeItem('clientify_google_access_token');
      triggerInAppNotification('🔑 Auth Session Expired', 'Please click sync again to renew your Google session.', 'info');
      return;
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Google Calendar API error.');
    }

    triggerInAppNotification(
      '📅 Google Calendar Synced!',
      `Successfully scheduled "${title}" deadline event in your Google Calendar with custom 1-day & 3-day notifications.`,
      'success'
    );

  } catch (error: any) {
    console.error('Error creating calendar event:', error);
    triggerInAppNotification('❌ Calendar Save Failed', error.message || 'Unable to register event.', 'urgent');
  }
}
