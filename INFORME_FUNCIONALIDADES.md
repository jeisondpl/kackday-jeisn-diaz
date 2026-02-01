# Informe de Funcionalidades - Domotica Automatiza

## Resumen Ejecutivo

**Domotica Automatiza** es una plataforma web de automatizacion inteligente desarrollada en React + TypeScript que proporciona herramientas avanzadas de monitoreo, control y optimizacion energetica para edificios inteligentes. El sistema integra capacidades de IA/LLM para analisis predictivo, deteccion de anomalias, automatizacion de procesos y recomendaciones personalizadas de eficiencia energetica.

### Vision del Proyecto

Transformar la gestion energetica de edificios mediante:
- **Automatizacion inteligente** de sistemas HVAC, iluminacion y equipos
- **Prediccion** de consumos y demandas energeticas
- **Deteccion proactiva** de anomalias y desperdicios
- **Optimizacion continua** basada en patrones de uso y ocupacion

---

## 1. Centro de Alertas y Prediccion

**Ruta:** `/inteligencia`

### 1.1 Descripcion General

Modulo central de monitoreo inteligente para edificios automatizados. Centraliza la deteccion de anomalias en sistemas domoticos, prediccion de consumo energetico y gestion de alertas de dispositivos. Utiliza algoritmos de Machine Learning y modelos LLM para proporcionar insights accionables y automatizar respuestas.

### 1.2 Casos de Uso en Domotica

| Caso de Uso | Descripcion |
|-------------|-------------|
| **Deteccion de fugas** | Identificar consumos anomalos en sistemas de agua |
| **HVAC ineficiente** | Alertar cuando climatizacion opera fuera de parametros |
| **Iluminacion desperdiciada** | Detectar luces encendidas en areas sin ocupacion |
| **Equipos en standby** | Identificar consumo fantasma de dispositivos |
| **Picos de demanda** | Predecir y prevenir sobrecargas electricas |

### 1.3 Componentes Funcionales

#### 1.3.1 Panel de Filtros de Automatizacion

| Filtro | Descripcion | Aplicacion Domotica |
|--------|-------------|---------------------|
| **Zona** | Area del edificio | Recepcion, Oficinas, Sala de servidores, Parking |
| **Sector** | Sistema domotico | HVAC, Iluminacion, Seguridad, Control de acceso |
| **Metrica** | Variable monitoreada | Energia, Temperatura, Humedad, CO2, Ocupacion |
| **Ventana temporal** | Periodo de analisis | Tiempo real hasta 7 dias |
| **Umbral** | Sensibilidad | Ajuste de deteccion de anomalias |

#### 1.3.2 Tarjetas de Resumen del Edificio

| Metrica | Descripcion |
|---------|-------------|
| **Alertas Activas** | Dispositivos/sistemas requiriendo atencion |
| **Anomalias Detectadas** | Patrones inusuales en consumo |
| **Prediccion 24h** | Consumo estimado del edificio |
| **Ahorro Potencial** | kWh que pueden optimizarse |
| **Dispositivos Online** | Estado de sensores y actuadores |

#### 1.3.3 Deteccion y Prediccion Domotica

**Panel de Anomalias:**
- Deteccion de comportamientos anomalos en dispositivos IoT
- Alertas de sistemas HVAC operando ineficientemente
- Identificacion de patrones de consumo inusuales
- Correlacion con eventos (horarios, ocupacion, clima)

**Panel de Prediccion (Forecast):**
- Prediccion de demanda energetica por zona
- Estimacion de ocupacion futura
- Planificacion de cargas para evitar picos
- Sugerencias de pre-acondicionamiento de espacios

#### 1.3.4 Analisis de Alertas de Automatizacion

**Tab: Analisis por Categoria**

Graficos de distribucion para identificar:
1. **Por Severidad:** Critica (accion inmediata), Alta, Media, Baja
2. **Por Zona:** Distribucion geografica de alertas
3. **Por Sistema:** HVAC, Iluminacion, Seguridad, Energia
4. **Por Estado:** Activa, En proceso, Resuelta, Programada
5. **Por Tipo:** Mantenimiento, Eficiencia, Seguridad, Confort

**Grafico Top N - Ranking de Problemas:**
- Zonas con mas alertas (identificar areas problematicas)
- Sistemas con mayor incidencia (priorizar mantenimiento)
- Tipos de alerta mas frecuentes (patrones recurrentes)

**Tab: Tendencias Temporales**
- Evolucion de alertas por dia/semana
- Correlacion con patrones de uso del edificio
- Identificacion de horarios criticos

#### 1.3.5 Tabla de Alertas de Dispositivos

| Columna | Descripcion |
|---------|-------------|
| ID | Identificador de alerta |
| Zona | Area del edificio |
| Sistema | HVAC, Iluminacion, etc. |
| Dispositivo | Sensor/actuador afectado |
| Valor | Lectura actual |
| Desviacion | % respecto al comportamiento normal |
| Severidad | Nivel de urgencia |
| Accion Sugerida | Automatica/Manual |

#### 1.3.6 Paneles de IA para Automatizacion

**Panel de Explicacion:**
- Analisis de causa raiz del problema
- Historial del dispositivo/sistema
- Factores ambientales contribuyentes
- Correlaciones con otros sistemas

**Panel de Recomendacion:**
- Acciones de automatizacion sugeridas
- Scripts de correccion automatica
- Ajustes de parametros recomendados
- Estimacion de ahorro post-correccion

### 1.4 Integracion con Sistemas Domoticos

```
Sensores IoT -> Gateway -> API -> Centro de Alertas
                                        |
                                        v
                              +-------------------+
                              | Analisis IA/ML    |
                              +-------------------+
                                        |
                    +-------------------+-------------------+
                    |                   |                   |
                    v                   v                   v
              Notificacion        Automatizacion      Recomendacion
              (Dashboard)         (Actuadores)        (Usuario)
```

### 1.5 Endpoints de Automatizacion

| Endpoint | Metodo | Funcion Domotica |
|----------|--------|------------------|
| `/llm/summary` | GET | Estado general del edificio |
| `/llm/anomalies` | GET | Anomalias en dispositivos |
| `/llm/forecast` | GET | Prediccion de consumo |
| `/llm/alerts` | GET | Alertas de sistemas |
| `/llm/alerts/:id/explain` | POST | Diagnostico IA |
| `/llm/alerts/:id/recommend` | POST | Accion correctiva |
| `/llm/baseline/recalculate` | POST | Recalibrar patrones normales |

---

## 2. Base de Conocimiento

**Ruta:** `/knowledge`

### 2.1 Descripcion General

Sistema de gestion documental que alimenta el modelo RAG (Retrieval-Augmented Generation) con conocimiento especializado en domotica, automatizacion y eficiencia energetica. Permite cargar manuales tecnicos, guias de instalacion, mejores practicas y especificaciones de dispositivos.

### 2.2 Tipos de Documentos para Domotica

| Categoria | Ejemplos |
|-----------|----------|
| **Manuales tecnicos** | Especificaciones de sensores, actuadores, controladores |
| **Guias de instalacion** | Procedimientos de montaje y configuracion |
| **Protocolos** | KNX, Modbus, BACnet, Zigbee, Z-Wave |
| **Mejores practicas** | Eficiencia HVAC, iluminacion LED, gestion de cargas |
| **Normativas** | Codigos electricos, certificaciones energeticas |
| **Casos de estudio** | Implementaciones exitosas, lecciones aprendidas |

### 2.3 Componentes Funcionales

#### 2.3.1 Panel de Estado de Documentos

**Metricas:**
- **Indexados:** Documentos procesados para consulta IA
- **Pendientes:** En cola de procesamiento
- **Por categoria:** Distribucion por tipo de documento

**Filtros de Busqueda:**
| Filtro | Opciones |
|--------|----------|
| Busqueda | Texto libre en titulo y contenido |
| Sistema | HVAC, Iluminacion, Seguridad, Control, Energia |
| Tags | Protocolos, marcas, tipos de dispositivo |

#### 2.3.2 Formulario de Carga

| Campo | Descripcion |
|-------|-------------|
| **Titulo** | Nombre descriptivo del documento |
| **Sistema** | Area de aplicacion domotica |
| **Tags** | Etiquetas para clasificacion |
| **Contenido** | Texto o referencia a archivo |

**Tags Sugeridos por Sistema:**

| Sistema | Tags Disponibles |
|---------|------------------|
| HVAC | climatizacion, ventilacion, calefaccion, termostatos, VRV |
| Iluminacion | LED, sensores_presencia, dimmers, DALI, escenas |
| Seguridad | CCTV, alarmas, control_acceso, sensores_movimiento |
| Control | PLCs, KNX, Modbus, BACnet, pasarelas |
| Energia | medidores, analizadores, UPS, generadores, solar |

### 2.4 Uso del Conocimiento en Automatizacion

```
Documento Tecnico
       |
       v
+------------------+
| Procesamiento    |
| (Chunking)       |
+------------------+
       |
       v
+------------------+
| Embeddings       |
| Vectoriales      |
+------------------+
       |
       v
+------------------+
| Indice RAG       |
+------------------+
       |
       +---> Consultas del Asistente IA
       |
       +---> Recomendaciones del Centro de Alertas
       |
       +---> Diagnosticos automatizados
```

### 2.5 Modelo de Datos

```typescript
interface KnowledgeDoc {
  id: number;
  title: string;
  content: string;
  filePath?: string;
  system?: string;        // HVAC, Iluminacion, etc.
  tags: string[];         // Protocolos, marcas, tipos
  deviceType?: string;    // Sensor, Actuador, Controlador
  manufacturer?: string;  // Fabricante del dispositivo
  indexed: boolean;
  chunksCount?: number;
  createdAt: string;
  updatedAt: string;
}
```

---

## 3. Asistente IA

**Ruta:** `/chatbot`

### 3.1 Descripcion General

Interfaz conversacional inteligente para consultas en lenguaje natural sobre el sistema domotico. Permite a usuarios tecnicos y no tecnicos interactuar con el edificio inteligente, obtener diagnosticos, solicitar acciones y recibir recomendaciones de optimizacion.

### 3.2 Capacidades del Asistente

| Capacidad | Descripcion |
|-----------|-------------|
| **Consultas de estado** | "Como esta el sistema HVAC?" |
| **Diagnosticos** | "Por que hay consumo alto en la zona norte?" |
| **Comandos** | "Baja la temperatura del salon a 22 grados" |
| **Reportes** | "Dame un resumen del consumo de esta semana" |
| **Predicciones** | "Cual sera la demanda manana?" |
| **Recomendaciones** | "Como puedo reducir el consumo nocturno?" |

### 3.3 Componentes Funcionales

#### 3.3.1 Panel de Contexto

| Campo | Funcion Domotica |
|-------|------------------|
| **Zona** | Filtrar por area del edificio |
| **Desde/Hasta** | Periodo de analisis |
| **Sistema** | HVAC, Iluminacion, etc. (futuro) |

#### 3.3.2 Ejemplos de Consultas Domoticas

| Categoria | Pregunta de Ejemplo |
|-----------|---------------------|
| **Estado** | "Cual es la temperatura actual en todas las zonas?" |
| **Consumo** | "Cuanto consumio el sistema HVAC ayer?" |
| **Comparacion** | "Compara el consumo de iluminacion entre pisos" |
| **Anomalias** | "Hay algun equipo consumiendo mas de lo normal?" |
| **Eficiencia** | "Que sistemas estan operando ineficientemente?" |
| **Automatizacion** | "A que hora deberia encender el HVAC para tener 22C a las 8am?" |
| **Mantenimiento** | "Que dispositivos necesitan mantenimiento?" |
| **Prediccion** | "Cual sera el pico de demanda manana?" |

### 3.4 Arquitectura RAG para Domotica

```
Pregunta del Usuario
       |
       v
+----------------------+
| Clasificacion Intent |
| (Consulta/Comando/   |
|  Diagnostico)        |
+----------------------+
       |
       v
+----------------------+     +------------------------+
| Busqueda Vectorial   | --> | Base de Conocimiento   |
| (Contexto tecnico)   |     | (Manuales, protocolos) |
+----------------------+     +------------------------+
       |
       v
+----------------------+     +------------------------+
| Consulta de Datos    | --> | Datos en Tiempo Real   |
| (Estado actual)      |     | (Sensores, medidores)  |
+----------------------+     +------------------------+
       |
       v
+----------------------+
| Generacion LLM       |
| (Respuesta natural)  |
+----------------------+
       |
       v
Respuesta + Fuentes + Acciones Sugeridas
```

### 3.5 Integracion con Actuadores (Futuro)

```typescript
// Flujo de comando por voz/texto
Usuario: "Apaga las luces del pasillo"
    |
    v
Asistente IA -> Validacion -> Confirmacion -> API Actuadores
    |                                              |
    v                                              v
"Luces del pasillo apagadas"              Comando KNX/Modbus
```

### 3.6 Respuesta del Asistente

```typescript
interface AssistantResponse {
  question: string;
  answer: string;
  data?: {
    readings?: SensorReading[];
    devices?: DeviceStatus[];
    metrics?: EnergyMetrics;
  };
  sources: string[];           // Documentos consultados
  suggestedActions?: Action[]; // Acciones automatizables
  timestamp: string;
}
```

---

## 4. Arquitectura Tecnica

### 4.1 Stack Tecnologico

| Capa | Tecnologia | Uso en Domotica |
|------|------------|-----------------|
| Framework | React 19 + TypeScript | UI responsiva |
| Build Tool | Vite | Desarrollo rapido |
| Styling | TailwindCSS v4 | Diseno corporativo |
| State | Zustand | Estado de dispositivos |
| HTTP | Axios | Comunicacion con APIs |
| Charts | ECharts | Visualizacion de datos |
| Routing | React Router v7 | Navegacion SPA |
| Validacion | Zod | Validacion de datos IoT |

### 4.2 Estructura del Proyecto

```
src/
├── features/
│   └── inteligencia/           # Modulo de automatizacion
│       ├── domain/
│       │   ├── entities/       # Device, Sensor, Alert, Zone
│       │   └── interfaces/     # Contratos de repositorios
│       ├── application/
│       │   ├── dto/            # Esquemas de validacion
│       │   └── store/          # Estado global (Zustand)
│       ├── infrastructure/
│       │   └── HttpRepository  # Comunicacion con backend
│       └── presentation/
│           ├── components/     # Widgets de dashboard
│           ├── hooks/          # Logica reutilizable
│           └── pages/          # Vistas principales
└── shared/
    └── components/
        ├── layout/             # Sidebar, Header
        └── ui/                 # Componentes base
```

### 4.3 Flujo de Datos en Tiempo Real

```
Sensores IoT
     |
     v
Gateway/Hub (MQTT/Modbus/KNX)
     |
     v
Backend API (Node.js)
     |
     v
WebSocket / Polling
     |
     v
Zustand Store
     |
     v
React Components (Auto-update)
```

### 4.4 Colores Corporativos

| Variable | Valor | Aplicacion |
|----------|-------|------------|
| `--color-corp-dark` | #084758 | Sidebar, headers, botones activos |
| `--color-corp-light` | #E3E3DB | Fondos de pagina |
| `--color-success` | #10B981 | Estados OK, dispositivos online |
| `--color-warning` | #F59E0B | Alertas medias, mantenimiento |
| `--color-danger` | #EF4444 | Alertas criticas, offline |

---

## 5. Configuracion y Despliegue

### 5.1 Variables de Entorno

```env
# APIs
VITE_API_URL=http://localhost:3000      # API de datos
VITE_LLM_API_URL=http://localhost:3001  # API de IA

# Domotica (futuro)
VITE_MQTT_BROKER=ws://localhost:9001    # Broker MQTT
VITE_REFRESH_INTERVAL=5000              # Polling en ms
```

### 5.2 Comandos de Desarrollo

```bash
# Iniciar en modo desarrollo
pnpm dev

# Construir para produccion
pnpm build

# Verificar tipos
pnpm tsc --noEmit

# Ejecutar linter
pnpm lint
```

---

## 6. Integracion con Ecosistema Domotico

### 6.1 Protocolos Soportados (Roadmap)

| Protocolo | Estado | Uso |
|-----------|--------|-----|
| REST API | Implementado | Comunicacion principal |
| WebSocket | Planificado | Tiempo real |
| MQTT | Planificado | Sensores IoT |
| KNX | Futuro | Automatizacion edificios |
| Modbus | Futuro | Equipos industriales |
| BACnet | Futuro | HVAC comercial |

### 6.2 Tipos de Dispositivos

| Categoria | Dispositivos |
|-----------|--------------|
| **Sensores** | Temperatura, Humedad, CO2, Presencia, Luz, Energia |
| **Actuadores** | Reles, Dimmers, Valvulas, Motores, Sirenas |
| **Controladores** | Termostatos, PLCs, Pasarelas, Hubs |
| **Medidores** | Contadores electricos, Agua, Gas, Calorias |

---

## 7. Roadmap de Funcionalidades

### 7.1 Corto Plazo
- [ ] Notificaciones push en tiempo real
- [ ] Dashboard personalizable con widgets
- [ ] Exportacion de reportes PDF/Excel
- [ ] Historico de conversaciones del asistente

### 7.2 Mediano Plazo
- [ ] Integracion MQTT para sensores IoT
- [ ] Control de actuadores desde el asistente
- [ ] Escenas y automatizaciones programables
- [ ] App movil (React Native)

### 7.3 Largo Plazo
- [ ] Integracion con asistentes de voz (Alexa, Google)
- [ ] Digital Twin del edificio
- [ ] Optimizacion energetica con RL (Reinforcement Learning)
- [ ] Certificacion energetica automatizada

---

## 8. Beneficios de la Plataforma

| Beneficio | Descripcion |
|-----------|-------------|
| **Ahorro energetico** | 15-30% reduccion en consumo |
| **Mantenimiento predictivo** | Detectar fallas antes de que ocurran |
| **Confort optimizado** | Ajuste automatico segun ocupacion |
| **Visibilidad total** | Dashboard centralizado de todo el edificio |
| **Decisiones informadas** | IA que explica y recomienda |
| **Escalabilidad** | Arquitectura preparada para crecer |

---

*Documento generado el 31 de enero de 2026*
*Version: 1.0*
*Proyecto: Domotica Automatiza - Plataforma de Automatizacion Inteligente de Edificios*
