export type MonitorLogJSON = {
  count: number;
  type: 'info' | 'success' | 'error' | 'warn';
  log: string;
}[];
