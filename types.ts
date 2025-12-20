
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

export enum SocketEvent {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  MESSAGE = 'message',
  METRIC_UPDATE = 'metric_update',
  USER_UPDATE = 'user_update'
}
