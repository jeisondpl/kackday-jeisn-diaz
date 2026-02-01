/**
 * Referencia a una sede UPTC
 * Value Object inmutable
 */
export interface SedeRef {
  readonly id: string; // UPTC_TUN, UPTC_DUI, UPTC_SOG, UPTC_CHI
  readonly nombre: string;
}

export const createSedeRef = (id: string, nombre: string): SedeRef => {
  if (!id || !nombre) {
    throw new Error('SedeRef requires id and nombre');
  }
  return Object.freeze({ id, nombre });
};
