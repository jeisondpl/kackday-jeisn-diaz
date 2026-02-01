# Guia de Instalacion - Domotica Automatiza

## Descripcion General

La plataforma **Domotica Automatiza** consta de tres proyectos interconectados:

| Proyecto | Descripcion | Puerto |
|----------|-------------|--------|
| **uptc-energia-api** | API REST para datos de consumo | 3000 |
| **uptc-energia-llm** | Servicio de IA/LLM con RAG | 3001 |
| **uptc-energia-web** | Frontend React Dashboard | 5173 |

---

## Requisitos Previos

### Software Requerido

| Software | Version Minima | Descarga |
|----------|----------------|----------|
| Node.js | 20.0.0+ | https://nodejs.org |
| pnpm | 8.0.0+ | `npm install -g pnpm` |
| Docker | 24.0.0+ | https://docker.com |
| Docker Compose | 2.0.0+ | Incluido con Docker Desktop |
| Git | 2.40.0+ | https://git-scm.com |

### Opcional (para LLM local)

| Software | Descripcion | Descarga |
|----------|-------------|----------|
| LM Studio | Ejecutar modelos LLM localmente | https://lmstudio.ai |
| Ollama | Alternativa para LLMs locales | https://ollama.ai |

### Verificar Instalacion

```bash
# Verificar versiones
node --version    # v20.x.x o superior
pnpm --version    # 8.x.x o superior
docker --version  # 24.x.x o superior
git --version     # 2.40.x o superior
```

---

## Estructura del Proyecto

```
HackDay/
├── uptc-energia-api/     # API REST (Express + PostgreSQL)
├── uptc-energia-llm/     # Servicio LLM (Fastify + LangChain)
├── uptc-energia-web/     # Frontend (React + Vite)
├── RECURSOS/             # Archivos de datos CSV
├── GUIA_INSTALACION.md   # Este archivo
└── INFORME_FUNCIONALIDADES.md
```

---

## Paso 1: Clonar el Repositorio

```bash
# Clonar el proyecto
git clone <url-del-repositorio> HackDay
cd HackDay
```

---

## Paso 2: Configurar Base de Datos (PostgreSQL + pgvector)

### 2.1 Iniciar Contenedores Docker

```bash
cd uptc-energia-api

# Crear archivo de variables de entorno
cp .env.example .env

# Iniciar PostgreSQL y Adminer
docker-compose up -d
```

### 2.2 Verificar Contenedores

```bash
docker ps
```

Debe mostrar:
```
CONTAINER ID   IMAGE                    STATUS         PORTS
xxxxxxxxxxxx   pgvector/pgvector:pg15   Up (healthy)   0.0.0.0:5432->5432/tcp
xxxxxxxxxxxx   adminer:4-standalone     Up             0.0.0.0:8080->8080/tcp
```

### 2.3 Acceder a Adminer (Opcional)

- **URL:** http://localhost:8080
- **Sistema:** PostgreSQL
- **Servidor:** postgres
- **Usuario:** uptc_admin
- **Contrasena:** uptc_password
- **Base de datos:** uptc_energia

### 2.4 Variables de Entorno - Base de Datos

```env
# uptc-energia-api/.env
POSTGRES_USER=uptc_admin
POSTGRES_PASSWORD=uptc_password
POSTGRES_DB=uptc_energia
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
API_PORT=3000
NODE_ENV=development
ADMINER_PORT=8080
```

---

## Paso 3: Instalar y Ejecutar API REST

### 3.1 Instalar Dependencias

```bash
cd uptc-energia-api
pnpm install
```

### 3.2 Cargar Datos Iniciales

```bash
# Ejecutar script de carga de datos CSV
pnpm run load
```

### 3.3 Iniciar el Servidor API

```bash
pnpm run dev
```

### 3.4 Verificar API

```bash
# En otra terminal
curl http://localhost:3000/health

# Respuesta esperada:
# {"status":"ok","timestamp":"..."}
```

### 3.5 Endpoints Disponibles

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/health` | Estado del servicio |
| GET | `/sedes` | Lista de sedes/zonas |
| GET | `/consumos` | Lecturas de consumo |
| GET | `/stats/diario` | Agregacion diaria |
| GET | `/stats/sector` | Desglose por sector |
| GET | `/stats/horario` | Patrones por hora |
| GET | `/stats/periodo` | Estadisticas por periodo |
| GET | `/stats/summary` | Resumen general |

---

## Paso 4: Instalar y Ejecutar Servicio LLM

### 4.1 Instalar Dependencias

```bash
cd uptc-energia-llm
pnpm install
```

### 4.2 Configurar Variables de Entorno

```bash
cp .env.example .env
```

### 4.3 Editar Configuracion LLM

```env
# uptc-energia-llm/.env

# Servidor
NODE_ENV=development
PORT=3001
LOG_LEVEL=info

# Conexion a API REST
ENERGY_API_BASE_URL=http://localhost:3000
ENERGY_API_TIMEOUT=30000

# Base de Datos (misma instancia)
DATABASE_URL=postgresql://uptc_admin:uptc_password@localhost:5432/uptc_energia
DATABASE_SCHEMA=uptc_llm
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Configuracion LLM
# Opcion 1: LM Studio (local)
LLM_BASE_URL=http://localhost:1234/v1
LLM_API_KEY=lm-studio
LLM_MODEL=local-model

# Opcion 2: Ollama (local)
# LLM_BASE_URL=http://localhost:11434/v1
# LLM_API_KEY=ollama
# LLM_MODEL=llama2

# Opcion 3: OpenAI (cloud)
# LLM_BASE_URL=https://api.openai.com/v1
# LLM_API_KEY=sk-your-api-key
# LLM_MODEL=gpt-4

# Parametros LLM
LLM_TEMPERATURE=0.2
LLM_MAX_TOKENS=2048

# Embeddings
EMBEDDINGS_MODEL=nomic-embed-text
EMBEDDINGS_DIMENSIONS=768

# Vector Store
VECTOR_STORE_TYPE=pgvector

# RAG
RAG_TOP_K=5
RAG_CHUNK_SIZE=1000
RAG_CHUNK_OVERLAP=200
RAG_MIN_SIMILARITY=0.7

# Funcionalidades
ENABLE_RULES_ENGINE=true
ENABLE_ANOMALY_DETECTION=true
ENABLE_FORECASTING=true

# Alertas
ALERT_RETENTION_DAYS=90
ANOMALY_ZSCORE_THRESHOLD=3.0
FORECAST_HORIZON_HOURS=24
```

### 4.4 Ejecutar Migraciones de Base de Datos

```bash
pnpm run db:migrate
```

### 4.5 Cargar Datos Semilla (Opcional)

```bash
pnpm run db:seed
```

### 4.6 Iniciar el Servidor LLM

```bash
pnpm run dev
```

### 4.7 Verificar Servicio LLM

```bash
curl http://localhost:3001/health
```

### 4.8 Documentacion API (Swagger)

- **URL:** http://localhost:3001/docs

### 4.9 Endpoints LLM Disponibles

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/health` | Estado del servicio |
| GET | `/llm/summary` | Resumen analitico |
| GET | `/llm/anomalies` | Deteccion de anomalias |
| GET | `/llm/forecast` | Predicciones |
| GET | `/llm/alerts` | Lista de alertas |
| POST | `/llm/alerts/:id/explain` | Explicacion IA |
| POST | `/llm/alerts/:id/recommend` | Recomendacion IA |
| GET | `/llm/docs` | Base de conocimiento |
| POST | `/llm/docs` | Crear documento |
| POST | `/llm/query` | Consulta lenguaje natural |

---

## Paso 5: Instalar y Ejecutar Frontend

### 5.1 Instalar Dependencias

```bash
cd uptc-energia-web
pnpm install
```

### 5.2 Configurar Variables de Entorno

```bash
# Crear archivo .env (si no existe)
echo "VITE_API_URL=http://localhost:3000" > .env
echo "VITE_LLM_API_URL=http://localhost:3001" >> .env
```

### 5.3 Iniciar Servidor de Desarrollo

```bash
pnpm run dev
```

### 5.4 Acceder a la Aplicacion

- **URL:** http://localhost:5173

### 5.5 Comandos Disponibles

| Comando | Descripcion |
|---------|-------------|
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` | Construir para produccion |
| `pnpm preview` | Vista previa de build |
| `pnpm lint` | Ejecutar linter |
| `pnpm tsc --noEmit` | Verificar tipos |

---

## Paso 6: Configurar LLM Local (Opcional)

### Opcion A: LM Studio

1. Descargar LM Studio desde https://lmstudio.ai
2. Instalar y abrir la aplicacion
3. Descargar un modelo compatible (recomendado: `llama-2-7b-chat` o `mistral-7b`)
4. Iniciar el servidor local en puerto 1234
5. Configurar en `.env`:
   ```env
   LLM_BASE_URL=http://localhost:1234/v1
   LLM_API_KEY=lm-studio
   LLM_MODEL=local-model
   ```

### Opcion B: Ollama

1. Instalar Ollama: https://ollama.ai
2. Descargar modelo:
   ```bash
   ollama pull llama2
   ```
3. Configurar en `.env`:
   ```env
   LLM_BASE_URL=http://localhost:11434/v1
   LLM_API_KEY=ollama
   LLM_MODEL=llama2
   ```

### Opcion C: OpenAI API

1. Obtener API Key en https://platform.openai.com
2. Configurar en `.env`:
   ```env
   LLM_BASE_URL=https://api.openai.com/v1
   LLM_API_KEY=sk-your-api-key-here
   LLM_MODEL=gpt-4
   ```

---

## Resumen de Puertos

| Servicio | Puerto | URL |
|----------|--------|-----|
| PostgreSQL | 5432 | localhost:5432 |
| Adminer | 8080 | http://localhost:8080 |
| API REST | 3000 | http://localhost:3000 |
| API LLM | 3001 | http://localhost:3001 |
| Frontend | 5173 | http://localhost:5173 |
| LM Studio | 1234 | http://localhost:1234 |
| Ollama | 11434 | http://localhost:11434 |

---

## Orden de Inicio

Para iniciar todo el sistema, seguir este orden:

```bash
# Terminal 1: Base de datos
cd uptc-energia-api
docker-compose up -d

# Terminal 2: API REST
cd uptc-energia-api
pnpm run dev

# Terminal 3: Servicio LLM
cd uptc-energia-llm
pnpm run dev

# Terminal 4: Frontend
cd uptc-energia-web
pnpm run dev
```

---

## Script de Inicio Rapido (Windows)

Crear archivo `start-all.bat` en la carpeta HackDay:

```batch
@echo off
echo Iniciando Domotica Automatiza...

echo [1/4] Iniciando PostgreSQL...
cd uptc-energia-api
start cmd /k "docker-compose up"

timeout /t 10

echo [2/4] Iniciando API REST...
start cmd /k "pnpm run dev"

timeout /t 5

echo [3/4] Iniciando Servicio LLM...
cd ..\uptc-energia-llm
start cmd /k "pnpm run dev"

timeout /t 5

echo [4/4] Iniciando Frontend...
cd ..\uptc-energia-web
start cmd /k "pnpm run dev"

echo.
echo Todos los servicios iniciados!
echo Frontend: http://localhost:5173
echo API REST: http://localhost:3000
echo API LLM:  http://localhost:3001
```

---

## Script de Inicio Rapido (Linux/Mac)

Crear archivo `start-all.sh` en la carpeta HackDay:

```bash
#!/bin/bash

echo "Iniciando Domotica Automatiza..."

# Iniciar PostgreSQL
echo "[1/4] Iniciando PostgreSQL..."
cd uptc-energia-api
docker-compose up -d
sleep 10

# Iniciar API REST
echo "[2/4] Iniciando API REST..."
pnpm run dev &
sleep 5

# Iniciar Servicio LLM
echo "[3/4] Iniciando Servicio LLM..."
cd ../uptc-energia-llm
pnpm run dev &
sleep 5

# Iniciar Frontend
echo "[4/4] Iniciando Frontend..."
cd ../uptc-energia-web
pnpm run dev &

echo ""
echo "Todos los servicios iniciados!"
echo "Frontend: http://localhost:5173"
echo "API REST: http://localhost:3000"
echo "API LLM:  http://localhost:3001"
```

---

## Solucion de Problemas

### Error: Puerto en uso

```bash
# Verificar que proceso usa el puerto
netstat -ano | findstr :3000

# Matar proceso (Windows)
taskkill /PID <pid> /F
```

### Error: Docker no inicia

```bash
# Verificar estado de Docker
docker info

# Reiniciar Docker Desktop
# Windows: Clic derecho en icono -> Restart
```

### Error: Conexion a base de datos

```bash
# Verificar contenedor PostgreSQL
docker ps
docker logs uptc_postgres

# Probar conexion manual
docker exec -it uptc_postgres psql -U uptc_admin -d uptc_energia
```

### Error: Modulo no encontrado

```bash
# Limpiar e reinstalar dependencias
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

### Error: CORS en frontend

Verificar que las URLs en `.env` coincidan con los puertos reales:
```env
VITE_API_URL=http://localhost:3000
VITE_LLM_API_URL=http://localhost:3001
```

---

## Credenciales por Defecto

| Servicio | Usuario | Contrasena |
|----------|---------|------------|
| PostgreSQL | uptc_admin | uptc_password |
| Base de datos | uptc_energia | - |

**IMPORTANTE:** Cambiar estas credenciales en produccion.

---

## Contacto y Soporte

- **Proyecto:** Domotica Automatiza
- **Version:** 1.0.0
- **Fecha:** Enero 2026

---

*Documento de instalacion generado para el proyecto Domotica Automatiza*
