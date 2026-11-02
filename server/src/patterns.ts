/**
 * Casillas que forman cada estilo de cartón (mismas figuras que dibuja el cliente).
 * `fila` y `columna` van de 0 a 4; las columnas son B, I, N, G, O.
 */
export const BOARD_TYPES = [1, 2, 3, 4, 5, 6, 7, 8] as const;

export function isInPattern(boardType: number, row: number, col: number): boolean {
  switch (boardType) {
    case 1:
      return row === 2;
    case 2:
      return col === 2;
    case 3:
      return row === col;
    case 4:
      return row + col === 4;
    case 5:
      return col === 0 || row === 4;
    case 6:
      return col === 4 || row === 4;
    case 7:
      return row === 0 || row === 4 || col === 0 || col === 4;
    case 8:
      return true;
    default:
      return false;
  }
}

export function isValidBoardType(value: unknown): value is number {
  return typeof value === 'number' && (BOARD_TYPES as readonly number[]).includes(value);
}

export const LETTERS = ['B', 'I', 'N', 'G', 'O'] as const;

export function letterFor(num: number) {
  return LETTERS[Math.min(4, Math.floor((num - 1) / 15))];
}

/** Rango válido de números de una columna: B 1-15, I 16-30, N 31-45, G 46-60, O 61-75. */
export function columnRange(col: number): [number, number] {
  return [col * 15 + 1, col * 15 + 15];
}
