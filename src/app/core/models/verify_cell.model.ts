type VerifyStatus =
  | 'pending'
  | 'success'
  | 'error'
  | 'warning'
  | 'active-success'
  | 'active-error'
  | 'active-warning';

export interface VerifyBall {
  id: number;
  isComplete: boolean;
  status: VerifyStatus;
}

export interface VerifyCell {
  number: number;
  isDrawn: boolean;
  isInGame: boolean;
  status: VerifyStatus;
}