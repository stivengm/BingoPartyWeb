type VerifyStatus =
  | 'pending'
  | 'success'
  | 'error'
  | 'active-success'
  | 'active-error';

export interface VerifyBall {
  id: number;
  isComplete: boolean;
  status: VerifyStatus;
}

export interface VerifyCell {
  number: number;
  isDrawn: boolean;
  status: VerifyStatus;
}