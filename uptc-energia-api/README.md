# UPTC Energy API

API REST para análisis de consumo energético de la Universidad Pedagógica y Tecnológica de Colombia (UPTC).

## Características

- **~275,000 registros** de consumo energético horario (2018-2025)
- **4 sedes**: Tunja, Duitama, Sogamoso, Chiquinquirá
- **Métricas**: energía por sector, agua, CO2, temperatura, ocupación
- **Vistas analíticas**: agregaciones diarias, por sector, horarias y por periodo académico

## Requisitos

- Docker y Docker Compose
- Node.js 20+

## Inicio Rápido

```bash
# 1. Configurar variables de entorno
copy .env.example .env

# 2. Iniciar PostgreSQL
docker compose up -d

# 3. Instalar dependencias
npm install

# 4. Cargar datos (~275K registros)
npm run load

# 5. Iniciar servidor
npm run dev
```

La API estará disponible en `http://localhost:3000`

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/health` | Estado de la API y base de datos |
| GET | `/sedes` | Lista de sedes (con `?with_stats=true` para estadísticas) |
| GET | `/sedes/:id` | Detalle de una sede |
| GET | `/consumos` | Lecturas de consumo con filtros |
| GET | `/consumos/:id` | Lectura específica |
| GET | `/stats/diario` | Consumo agregado por día |
| GET | `/stats/sector` | Distribución por sector |
| GET | `/stats/horario` | Patrones horarios |
| GET | `/stats/periodo` | Consumo por periodo académico |
| GET | `/stats/summary` | Resumen general |

### Parámetros de Consulta

**Filtros comunes:**
- `sede_id` - Filtrar por sede (`UPTC_TUN`, `UPTC_DUI`, `UPTC_SOG`, `UPTC_CHI`)
- `from` / `to` - Rango de fechas (ISO 8601)
- `limit` - Máximo de resultados (default: 100, max: 1000)
- `offset` - Paginación
- `order` - Orden temporal (`asc` / `desc`)

### Ejemplos

```bash
# Health check
curl http://localhost:3000/health

# Listar sedes con estadísticas
curl "http://localhost:3000/sedes?with_stats=true"

# Consumos de Tunja en enero 2025
curl "http://localhost:3000/consumos?sede_id=UPTC_TUN&from=2025-01-01&to=2025-01-31"

# Estadísticas diarias de diciembre
curl "http://localhost:3000/stats/diario?from=2025-12-01&to=2025-12-31"

# Patrones horarios en días de semana
curl "http://localhost:3000/stats/horario?es_fin_semana=false"

# Resumen general
curl http://localhost:3000/stats/summary
```

## Modelo de Datos

### Tabla `sedes`
Metadatos de cada sede: área, estudiantes, empleados, edificios, altitud, temperatura promedio.

### Tabla `consumos`
Lecturas horarias con:
- Energía total y por sector (comedor, salones, laboratorios, auditorios, oficinas)
- Potencia, agua, CO2, temperatura exterior, ocupación
- Dimensiones temporales (hora, día, mes, trimestre, año, periodo académico)
- Indicadores (fin de semana, festivo, semana de parciales/finales)

### Vistas Analíticas
| Vista | Descripción |
|-------|-------------|
| `v_consumo_diario` | Agregación diaria con promedios, sumas, min/max |
| `v_consumo_por_sector` | Distribución porcentual por sector |
| `v_patron_horario` | Promedios por hora del día |
| `v_consumo_por_periodo` | Agregación por periodo académico |
| `v_sedes_con_stats` | Sedes con estadísticas históricas |

## Administración de Base de Datos

### Adminer (GUI Web)
Disponible en `http://localhost:8080`
- Sistema: PostgreSQL
- Servidor: `postgres`
- Usuario: `uptc_admin`
- Contraseña: `uptc_password`
- Base de datos: `uptc_energia`

### psql (CLI)
```bash
docker exec -it uptc_postgres psql -U uptc_admin -d uptc_energia
```

## Comandos Útiles

```bash
npm run dev     # Iniciar servidor
npm run load    # Cargar/recargar datos CSV
npm test        # Test de health check

docker compose up -d      # Iniciar PostgreSQL
docker compose down       # Detener (mantiene datos)
docker compose down -v    # Detener y eliminar datos
```

## Estructura del Proyecto

```
├── src/
│   ├── server.js          # Servidor Express
│   ├── db.js              # Pool de conexiones PostgreSQL
│   └── routes/            # Endpoints de la API
├── db/
│   ├── 01_schema.sql      # Definición de tablas
│   ├── 02_constraints.sql # Índices
│   └── 03_views.sql       # Vistas analíticas
├── scripts/
│   └── load_data.js       # Cargador de CSV
└── docker-compose.yml     # Configuración de Docker
```

## Solución de Problemas

| Error | Solución |
|-------|----------|
| `ECONNREFUSED :5432` | Esperar 10-15 segundos después de `docker compose up` |
| `Cannot find module` | Ejecutar `npm install` |
| `relation does not exist` | Ejecutar `docker compose down -v && docker compose up -d` |

## Licencia

MIT
