export type MonitorLog = {
  count: number;
  type: MonitorLogType;
  log: string;
};

export type MonitorLogType = 'info' | 'success' | 'error' | 'warn';
