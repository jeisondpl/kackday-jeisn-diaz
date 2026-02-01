import { z } from 'zod';

// Helper for nullable numbers from DB - converts null/string to number
const numField = z.preprocess(
  (val) => {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'number' && Number.isNaN(val)) return 0;
    if (typeof val === 'string') return parseFloat(val) || 0;
    return val;
  },
  z.number()
);

// Helper for nullable strings
const strField = z.preprocess(
  (val) => (val === null || val === undefined ? '' : String(val)),
  z.string()
);

// Sede schema (basic)
export const SedeSchema = z.object({
  sede_id: z.string(),
  sede: z.string(),
  nombre_completo: z.string().optional(),
  ciudad: z.string(),
  area_m2: numField,
  num_estudiantes: numField,
  num_empleados: numField,
  num_edificios: numField,
  tiene_residencias: z.boolean().optional(),
  tiene_laboratorios_pesados: z.boolean().optional(),
  altitud_msnm: numField,
  temp_promedio_c: numField,
  pct_comedores: numField,
  pct_salones: numField,
  pct_laboratorios: numField,
  pct_auditorios: numField,
  pct_oficinas: numField,
  created_at: z.string().optional(),
});

// Sede con stats
export const SedeConStatsSchema = SedeSchema.extend({
  total_lecturas: numField,
  primera_lectura: strField,
  ultima_lectura: strField,
  energia_promedio_kwh: numField,
  energia_total_historica_kwh: numField,
  co2_total_historico_kg: numField,
});

// Consumo Diario - matches v_consumo_diario view
export const ConsumoDiarioSchema = z.object({
  sede_id: z.string(),
  sede: z.string(),
  fecha: z.string(),
  año: z.number().optional(),
  mes: z.number().optional(),
  trimestre: z.number().optional(),
  num_lecturas: numField,
  energia_total_promedio_kwh: numField,
  energia_total_suma_kwh: numField,
  energia_total_min_kwh: numField,
  energia_total_max_kwh: numField,
  co2_total_kg: numField,
  agua_total_litros: numField,
  temp_promedio_c: numField,
  ocupacion_promedio_pct: numField,
  incluye_fin_semana: z.boolean().optional(),
  incluye_festivo: z.boolean().optional(),
});

// Consumo por Sector - matches v_consumo_por_sector view
export const ConsumoSectorSchema = z.object({
  sede_id: z.string(),
  sede: z.string(),
  fecha: z.string(),
  energia_comedor_total_kwh: numField,
  energia_salones_total_kwh: numField,
  energia_laboratorios_total_kwh: numField,
  energia_auditorios_total_kwh: numField,
  energia_oficinas_total_kwh: numField,
  pct_comedor: numField,
  pct_salones: numField,
  pct_laboratorios: numField,
  pct_auditorios: numField,
  pct_oficinas: numField,
});

// Patron Horario - matches v_patron_horario view
export const PatronHorarioSchema = z.object({
  sede_id: z.string(),
  sede: z.string(),
  hora: z.number(),
  dia_nombre: z.string(),
  es_fin_semana: z.boolean(),
  num_lecturas: numField,
  energia_promedio_kwh: numField,
  potencia_promedio_kw: numField,
  ocupacion_promedio_pct: numField,
});

// Consumo por Periodo - matches v_consumo_por_periodo view
export const ConsumoPeriodoSchema = z.object({
  sede_id: z.string(),
  sede: z.string(),
  año: z.number(),
  periodo_academico: z.string(),
  num_lecturas: numField,
  energia_total_kwh: numField,
  energia_promedio_kwh: numField,
  co2_total_kg: numField,
  agua_total_litros: numField,
});

// Resumen General
export const ResumenGeneralSchema = z.object({
  total_sedes: numField,
  total_lecturas: numField,
  fecha_inicio: strField,
  fecha_fin: strField,
  energia_promedio_kwh: numField,
  energia_total_kwh: numField,
  co2_total_kg: numField,
  agua_total_litros: numField,
});

// Consumo individual (raw reading)
export const ConsumoSchema = z.object({
  reading_id: z.number(),
  timestamp: z.string(),
  sede: z.string(),
  sede_id: z.string(),
  energia_total_kwh: numField,
  energia_comedor_kwh: numField,
  energia_salones_kwh: numField,
  energia_laboratorios_kwh: numField,
  energia_auditorios_kwh: numField,
  energia_oficinas_kwh: numField,
  potencia_total_kw: numField,
  agua_litros: numField,
  temperatura_exterior_c: numField,
  ocupacion_pct: numField,
  hora: z.number(),
  dia_semana: z.number(),
  dia_nombre: z.string(),
  mes: z.number(),
  trimestre: z.number(),
  año: z.number(),
  periodo_academico: z.string(),
  es_fin_semana: z.boolean(),
  es_festivo: z.boolean(),
  es_semana_parciales: z.boolean(),
  es_semana_finales: z.boolean(),
  co2_kg: numField,
});

// API Response wrappers
export function createApiResponseSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    count: z.number(),
    total: z.number().optional(),
    limit: z.number().optional(),
    offset: z.number().optional(),
    data: z.array(dataSchema),
  });
}

export function createSimpleResponseSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    count: z.number(),
    data: z.array(dataSchema),
  });
}

// Type exports
export type SedeDTO = z.infer<typeof SedeSchema>;
export type SedeConStatsDTO = z.infer<typeof SedeConStatsSchema>;
export type ConsumoDTO = z.infer<typeof ConsumoSchema>;
export type ConsumoDiarioDTO = z.infer<typeof ConsumoDiarioSchema>;
export type ConsumoSectorDTO = z.infer<typeof ConsumoSectorSchema>;
export type PatronHorarioDTO = z.infer<typeof PatronHorarioSchema>;
export type ConsumoPeriodoDTO = z.infer<typeof ConsumoPeriodoSchema>;
export type ResumenGeneralDTO = z.infer<typeof ResumenGeneralSchema>;
