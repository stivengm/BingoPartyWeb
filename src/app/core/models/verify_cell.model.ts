type VerifyStatus =
  | 'pending'
  | 'success'
  | 'error';
  
interface VerifyCell {
  number: number;
  isDrawn: boolean;
  status: VerifyStatus;
}