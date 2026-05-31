export const enum statusBall {
    Pending = 'pending',
    Success = 'success',
    Error = 'error'
};

export interface VerifyBall {
  id: number;
  isComplete: boolean;
  status: statusBall
}

export interface CalledBall {
  calledAt: number;
  letter: string;
  number: number;
  value: string;
}