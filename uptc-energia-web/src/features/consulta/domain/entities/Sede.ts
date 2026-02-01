export interface Sede {
  sede_id: string;
  sede: string;
  nombre_completo?: string;
  ciudad: string;
  area_m2: number;
  num_estudiantes: number;
  num_empleados: number;
  num_edificios: number;
  tiene_residencias?: boolean;
  tiene_laboratorios_pesados?: boolean;
  altitud_msnm: number;
  temp_promedio_c: number;
  pct_comedores: number;
  pct_salones: number;
  pct_laboratorios: number;
  pct_auditorios: number;
  pct_oficinas: number;
}

export interface SedeConStats extends Sede {
  total_lecturas: number;
  primera_lectura: string;
  ultima_lectura: string;
  energia_promedio_kwh: number;
  energia_total_historica_kwh: number;
  co2_total_historico_kg: number;
}
