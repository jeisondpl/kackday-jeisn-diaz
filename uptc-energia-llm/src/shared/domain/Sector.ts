/**
 * Sectores de consumo energético
 */
export enum Sector {
  COMEDOR = 'comedor',
  SALONES = 'salones',
  LABORATORIOS = 'laboratorios',
  AUDITORIOS = 'auditorios',
  OFICINAS = 'oficinas',
  GENERAL = 'general', // para métricas agregadas
}

export const isSector = (value: string): value is Sector => {
  return Object.values(Sector).includes(value as Sector);
};
