export interface Consumo {
  reading_id: number;
  timestamp: string;
  sede: string;
  sede_id: string;
  energia_total_kwh: number;
  energia_comedor_kwh: number;
  energia_salones_kwh: number;
  energia_laboratorios_kwh: number;
  energia_auditorios_kwh: number;
  energia_oficinas_kwh: number;
  potencia_total_kw: number;
  agua_litros: number;
  temperatura_exterior_c: number;
  ocupacion_pct: number;
  hora: number;
  dia_semana: number;
  dia_nombre: string;
  mes: number;
  trimestre: number;
  año: number;
  periodo_academico: string;
  es_fin_semana: boolean;
  es_festivo: boolean;
  es_semana_parciales: boolean;
  es_semana_finales: boolean;
  co2_kg: number;
}

export interface ConsumoDiario {
  sede_id: string;
  sede: string;
  fecha: string;
  año?: number;
  mes?: number;
  trimestre?: number;
  num_lecturas: number;
  energia_total_promedio_kwh: number;
  energia_total_suma_kwh: number;
  energia_total_min_kwh: number;
  energia_total_max_kwh: number;
  co2_total_kg: number;
  agua_total_litros: number;
  temp_promedio_c: number;
  ocupacion_promedio_pct: number;
  incluye_fin_semana?: boolean;
  incluye_festivo?: boolean;
}

export interface ConsumoSector {
  sede_id: string;
  sede: string;
  fecha: string;
  energia_comedor_total_kwh: number;
  energia_salones_total_kwh: number;
  energia_laboratorios_total_kwh: number;
  energia_auditorios_total_kwh: number;
  energia_oficinas_total_kwh: number;
  pct_comedor: number;
  pct_salones: number;
  pct_laboratorios: number;
  pct_auditorios: number;
  pct_oficinas: number;
}

export interface PatronHorario {
  sede_id: string;
  sede: string;
  hora: number;
  dia_nombre: string;
  es_fin_semana: boolean;
  num_lecturas: number;
  energia_promedio_kwh: number;
  potencia_promedio_kw: number;
  ocupacion_promedio_pct: number;
}

export interface ConsumoPeriodo {
  sede_id: string;
  sede: string;
  año: number;
  periodo_academico: string;
  num_lecturas: number;
  energia_total_kwh: number;
  energia_promedio_kwh: number;
  co2_total_kg: number;
  agua_total_litros: number;
}

export interface ResumenGeneral {
  total_sedes: number;
  total_lecturas: number;
  fecha_inicio: string;
  fecha_fin: string;
  energia_promedio_kwh: number;
  energia_total_kwh: number;
  co2_total_kg: number;
  agua_total_litros: number;
}
