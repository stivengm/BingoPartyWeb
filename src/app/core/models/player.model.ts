export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  avatar: string;
  connected?: boolean;
}
