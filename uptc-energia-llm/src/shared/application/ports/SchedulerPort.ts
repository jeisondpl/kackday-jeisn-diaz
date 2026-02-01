export interface SchedulerStatus {
  isRunning: boolean;
  jobsCount: number;
}

export interface SchedulerPort {
  start(): void;
  stop(): void;
  getStatus(): SchedulerStatus;
}
