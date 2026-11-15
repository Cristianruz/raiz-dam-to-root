<!-- AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026 -->
# Diagramas de ROOT: el sistema tal como está (15-nov-2026)

**Qué es:** el mapa del sistema completo en diagramas Mermaid, hecho a partir de lo que hay en el repositorio: S9 (alcance), S8, S10, el kit v4 (contrato §2, reglas §2.4, pantallas C1–C5 y X3.2), `construir.py`, `motor/`, `web/` y `.github/workflows/publicar.yml`. Es la base del pase de diseño (`docs/diseno/README.md`).

**Reglas de estos diagramas:**
- **No llevan cifras de datos.** Donde el sistema usa un umbral o un parámetro, se nombra su clave de `data/params.json` o su campo del contrato (por ejemplo `memoria.ndvi_verde` o `agua.lamina_bruta`). Así no se desactualizan y cumplen las reglas 2 y 3 de `CLAUDE.md`. Las únicas cifras son versiones de herramientas y horas del plan del evento (S10).
- **Textos de la interfaz en inglés**, tal como aparecen en la página; el resto, en español.
- Si un diagrama y el código difieren, manda el código; si el código y S9 difieren, se anota en la bitácora (`docs/progreso.md`).

**Índice**
1. [Contexto del sistema](#1-contexto-del-sistema)
2. [Flujo de datos de extremo a extremo](#2-flujo-de-datos-de-extremo-a-extremo)
3. [El comando único `python construir.py`](#3-el-comando-único-python-construirpy)
4. [Qué módulo escribe cada archivo de `web/data/`](#4-qué-módulo-escribe-cada-archivo-de-webdata)
5. [Integración continua y publicación](#5-integración-continua-y-publicación)
6. [Arquitectura de la web](#6-arquitectura-de-la-web)
7. [Navegación: las tres pantallas](#7-navegación-las-tres-pantallas)
8. [Secuencia: mover el deslizador](#8-secuencia-mover-el-deslizador)
9. [Reglas por parcela: cobertura, hectáreas y semáforo](#9-reglas-por-parcela-cobertura-hectáreas-y-semáforo)
10. [Indicador principal: agua ya comprometida](#10-indicador-principal-agua-ya-comprometida)
11. [Estado del plazo del agua](#11-estado-del-plazo-del-agua)
12. [La memoria de la parcela](#12-la-memoria-de-la-parcela)
13. [La gota: balance del agua](#13-la-gota-balance-del-agua)
14. [Estados de La gota en la ficha](#14-estados-de-la-gota-en-la-ficha)
15. [Anatomía de la ficha de parcela](#15-anatomía-de-la-ficha-de-parcela)
16. [Modelo de datos (contrato v4)](#16-modelo-de-datos-contrato-v4)
17. [Las cinco pruebas a la vista](#17-las-cinco-pruebas-a-la-vista)
18. [Protocolo de revisión de cada pieza](#18-protocolo-de-revisión-de-cada-pieza)
19. [Plan del domingo (S10)](#19-plan-del-domingo-s10)

---

## 1. Contexto del sistema
Quién usa ROOT, de dónde vienen los datos y por dónde se publica. Fuentes: S9 §3 y §10, `CLAUDE.md` («Operación»), README («NASA Data»).

```mermaid
flowchart LR
  subgraph Usuarios["Quién lo usa"]
    AGR["Agricultor<br/>lee la ficha y el mensaje"]
    TEC["Técnico de módulo<br/>decide con el agricultor"]
    JUR["Jurado de Space Apps"]
  end
  subgraph Equipo["Equipo Orbital Farming"]
    CR["Cristian · integrador<br/>Claude Code"]
    P26["P2–P6<br/>Colab y Gemini"]
    EES["Sesión de Earth Engine<br/>fuera de este repo"]
  end
  subgraph Fuentes["Datos abiertos"]
    NASA["NASA: HLS · POWER · NASADEM · GPM IMERG<br/>SMAP · MODIS · GRACE · GLDAS · NLDAS · GEDI"]
    USGS["USGS: SSEBop VIIRS"]
    FTW["Fields of The World 2025"]
    MX["México: Conagua · SIH · INIFAP · FIRA · IMTA"]
  end
  ROOT(["ROOT – From Dam to Root<br/>gemelo digital de las zonas piloto"])
  GH["GitHub<br/>Actions + Pages"]
  NASA --> EES
  USGS --> EES
  FTW --> P26
  MX --> P26
  EES --> DRV["Drive · Raiz_entregas/"]
  P26 --> DRV
  DRV --> CR
  CR --> ROOT
  ROOT --> GH
  GH --> AGR & TEC & JUR
  WA["WhatsApp<br/>solo vista previa: no se envía nada"]
  ROOT -.-> WA
```

## 2. Flujo de datos de extremo a extremo
Del satélite a la página. Nada entra a `data/processed/` sin pasar el contrato, y nada se publica sin pasar las pruebas. Fuentes: `CLAUDE.md` («Operación», regla 6), kit §2.1, README («Pipeline»).

```mermaid
flowchart TD
  RAW["data/raw/<br/>datos públicos sin modificar"] -.-> CAP
  CAP["Earth Engine y Colab<br/>piezas A1–A9 y B1–B3 del kit"] --> BUZ["Drive · Raiz_entregas/<br/>LEEME.md: archivo · fuente · fecha · script"]
  BUZ -->|"RAIZ_BUZON"| ENS{"motor/ensamblar.py<br/>valida contra motor/esquemas.py<br/>tabla 0.4-B del kit"}
  ENS -->|"pasa"| PRO["data/processed/<br/>copia sin cambios<br/>sha256 en fuentes.json"]
  ENS -->|"no pasa"| REC["rechazado o retenido<br/>queda en el reporte<br/>nunca se corrige en silencio"]
  PAR["data/params.json<br/>cada constante con valor, unidad, fuente y etiqueta"] --> CON
  PRO --> CON["python construir.py<br/>comando único"]
  CON --> WD["web/data/<br/>cubo · parcelas · explicaciones · manifest<br/>relieve · gemelo · contexto · suelo · pruebas"]
  CON --> PRU["docs/pruebas.md<br/>tabla de pasos de la última corrida"]
  WD --> WEB["web/ estática<br/>HTML + JS + MapLibre GL + d3-sankey"]
  WEB --> PAG["GitHub Pages<br/>solo si todo pasa"]
  WEB --> OFF["Demo sin red en un solo HTML<br/>motor/demo_offline.py"]
```

## 3. El comando único `python construir.py`
Orden real de los pasos en `construir.py` → `main()`. Un paso en FALLA hace que el comando salga con código 1 y que GitHub Actions no publique.

```mermaid
flowchart TD
  INI(["python construir.py"]) --> QO{"¿--origen?"}
  QO -->|"sí"| ORI["origen<br/>vuelve a pedir APIs sin sesión<br/>y compara sha384 de web/vendor"]
  QO -->|"no: OMITIDO"| ENS
  ORI --> ENS["ensamblar<br/>valida el buzón<br/>OMITIDO si no hay RAIZ_BUZON"]
  ENS --> B4["simulados / B4<br/>cubo.json y parcelas.geojson con datos reales<br/>nunca reemplaza un cubo real por uno simulado"]
  B4 --> REL["relieve<br/>relieve.json y rutas de escurrimiento"]
  REL --> GEM["gemelo<br/>gemelo_web · contexto_web · suelo_web<br/>cada pieza sin entrega escribe null con su motivo"]
  GEM --> PWA1["pwa<br/>iconos, manifest de la app y precache"]
  PWA1 --> MAN["manifest<br/>cada cifra con fuente, fecha, script y etiqueta"]
  MAN --> CTR["contrato<br/>validar_contrato.py"]
  CTR --> VER["verificador<br/>set dorado de casos con trampas"]
  VER --> QR{"¿--rapido?"}
  QR -->|"no"| PYT["pytest"]
  PYT --> NOD["node --test"]
  NOD --> PWEB["docs/pruebas.md y pruebas_web<br/>después: manifest c2 y pwa otra vez"]
  QR -->|"sí: pytest, node y pruebas_web OMITIDOS"| QF
  PWEB --> QF{"¿algún paso en FALLA?"}
  QF -->|"sí"| X1(["salida 1 · no se publica"])
  QF -->|"no"| X0(["salida 0 · OK: todo pasa"])
```

## 4. Qué módulo escribe cada archivo de `web/data/`
Ningún archivo de `web/data/` se escribe a mano (kit §2.5). La web los lee; los opcionales pueden faltar y la página lo dice.

```mermaid
flowchart LR
  subgraph Motor["motor/"]
    B4["b4_cubo.py<br/>B4 + X3.1"]
    SIM["simulados.py<br/>solo sin datos reales"]
    RW["relieve_web.py"]
    GW["gemelo_web.py"]
    NW["ndvi_web.py"]
    DT["dem_teselas.py<br/>aparte: necesita rasterio"]
    CW["contexto_web.py"]
    SW["suelo_web.py"]
    PWB["pruebas_web.py"]
    MF["manifest.py"]
    PW["pwa.py"]
  end
  subgraph Datos["web/data/"]
    CUBO["cubo.json"]
    GEO["parcelas.geojson"]
    EXP["explicaciones.json"]
    RJ["relieve.json<br/>relieve_rutas.geojson"]
    GJ["gemelo.json"]
    NJ["ndvi_mensual.json"]
    DEM["dem/ teselas"]
    CJ["contexto.json"]
    SJ["suelo.json"]
    PJ["pruebas.json"]
    MJ["manifest.json"]
    PC["precache.json"]
  end
  B4 --> CUBO & GEO & EXP
  SIM -.-> CUBO & GEO & EXP
  RW --> RJ
  GW --> GJ
  NW --> NJ
  DT --> DEM
  CW --> CJ
  SW --> SJ
  PWB --> PJ
  MF --> MJ
  PW --> PC
```

## 5. Integración continua y publicación
`.github/workflows/publicar.yml`. La rama de trabajo nunca publica: solo `main`, y solo con el job de pruebas en verde.

```mermaid
flowchart LR
  EV["push o pull request"] --> J1["job pruebas<br/>Python 3.12 · Node 22<br/>pip install -r requirements.txt<br/>python construir.py"]
  EV --> J2["job auditoria<br/>pip-audit sobre requirements.txt"]
  J1 --> Q{"¿push a main<br/>y pruebas en verde?"}
  Q -->|"sí"| UP["upload-pages-artifact<br/>carpeta web/"]
  UP --> J3["job publicar<br/>deploy a GitHub Pages"]
  Q -->|"no"| NP(["no se publica"])
```

## 6. Arquitectura de la web
Página estática sin frameworks (regla 5). `app.js` coordina; cada pieza vive en su módulo de `web/js/`; las reglas del deslizador viven en **una** función (`web/reglas.js`) que también usan las pruebas.

```mermaid
flowchart TB
  HTML["index.html<br/>estructura y textos fijos, sin cifras"] --> APP
  HTML --> VEN["web/vendor/ con versión fija y sha384<br/>MapLibre GL · d3 · d3-sankey"]
  APP["app.js<br/>estado · controles · mapa · lista · ficha · zonas"] --> RG["reglas.js<br/>cobertura · hectáreas · semáforo<br/>agua comprometida · marcadores"]
  APP --> CC
  APP --> FI
  APP --> AY
  subgraph CC["Centro de control"]
    direction TB
    REL["relieve.js<br/>Terrain & runoff · Simulate a storm"]
    G3D["gemelo3d.js<br/>vista 3D y columnas de agua"]
    TIE["tiempo.js<br/>Observed state by year"]
    EST["estado_gemelo.js<br/>Twin status"]
    CTX["contexto.js<br/>Regional context · GEDI · helada"]
  end
  subgraph FI["Ficha y mensaje"]
    direction TB
    RES["resumen.js<br/>frase · NDVI · enlace #id"]
    SUE["suelo.js<br/>perfil de suelo y aptitud"]
    GOT["gota.js<br/>Follow the drop"]
    MEN["mensaje.js<br/>WhatsApp · Print field sheet"]
  end
  subgraph AY["Ayuda y app"]
    direction TB
    ACE["acerca.js<br/>How it works · About & Data"]
    INS["instalar.js<br/>app instalable"]
  end
  APP --> OBL[("web/data/ obligatorios<br/>cubo.json · parcelas.geojson<br/>explicaciones.json")]
  APP -.-> OPC[("web/data/ opcionales<br/>gemelo · contexto · ndvi_mensual<br/>relieve · suelo · manifest · pruebas")]
  SWK["sw.js<br/>copia sin conexión"] -.-> OBL & OPC
```

## 7. Navegación: las tres pantallas
Las tres pantallas de S9 §3 y sus salidas. La ficha se puede abrir con un enlace directo (`#` + id de la parcela).

```mermaid
flowchart TD
  ENT(["Abrir la página"]) --> INI{"¿primera visita?"}
  INI -->|"sí"| HOW["How it works<br/>1. Set the water allocation<br/>2. Tap a field<br/>3. Compare rotations"]
  INI -->|"no"| CC
  HOW --> CC
  HASH(["Enlace con #id"]) --> FI
  subgraph P1["Pantalla 1 · Centro de control"]
    CC["Mapa de la zona piloto<br/>deslizador de dotación + Rain −20 %<br/>indicador de agua ya comprometida"]
    CC --> COL["Color fields by<br/>Enough water? · Water term · capas"]
    CC --> T3D["Vista 3D y línea de tiempo"]
    CC --> LIS["Lista de parcelas con buscador"]
    CC --> PAN["Paneles: La Boquilla · acuífero<br/>Regional context · Twin status"]
    CC --> TOR["Terrain overlay · Simulate a storm"]
  end
  CC -->|"tocar una parcela"| FI
  LIS -->|"Enter o clic"| FI
  subgraph P2["Pantalla 2 · Ficha de parcela"]
    FI["Encabezado · memoria · tarjetas<br/>Water · Soil · Money"]
    FI --> WHY["Why? · las cinco respuestas"]
    FI --> DROP["Follow the drop"]
  end
  subgraph P3["Pantalla 3 · Mensaje al agricultor"]
    WA["Preview WhatsApp message<br/>en español"]
    PR["Print field sheet"]
  end
  FI --> WA & PR
  CC --> ABO["About & Data<br/>datos NASA · cinco pruebas · manifest"]
  FI -->|"Close o Escape"| CC
```

## 8. Secuencia: mover el deslizador
Con cada movimiento la web recalcula todo **sin pedir datos nuevos** (kit C1 paso 4).

```mermaid
sequenceDiagram
  actor U as Usuario
  participant C as Controles · app.js
  participant R as reglas.js
  participant M as Mapa MapLibre
  participant P as Panel y lista
  participant F as Ficha abierta
  U->>C: mueve el deslizador, toca una marca o el interruptor de lluvia
  C->>C: leerControles da D y r
  loop cada parcela
    C->>R: evaluarOpcion(opción ACTUAL, area_ha, D, r, abstenida)
    R-->>C: cobertura, hectáreas con rango y semáforo
  end
  C->>R: conteosZona(features, cubo, D, r)
  R-->>C: verde, ámbar, rojo y gris
  C->>R: aguaComprometida(zona, D, r)
  R-->>C: porcentaje con rango, o mensaje de dotación cero
  C->>M: repinta el color de cada parcela
  C->>P: indicador principal, segunda cifra y conteos
  opt hay una ficha abierta
    C->>F: hectáreas y semáforo de cada tarjeta
    C->>F: marcadores dinámicos de Why?
  end
```

## 9. Reglas por parcela: cobertura, hectáreas y semáforo
Kit §2.4; código en `web/reglas.js` (`cobertura`, `hectareasQueAlcanzan`, `semaforoAgua`, `evaluarOpcion`). D = valor del deslizador; r = lluvia elegida; L10, L50 y L90 = `agua.lamina_bruta[r]` de la opción.

```mermaid
flowchart TD
  IN["Entradas<br/>D en millares por hectárea · r en lluvia_pct<br/>L10, L50, L90 de la opción"] --> AB{"¿parcela abstenida?"}
  AB -->|"sí"| GR["gris<br/>sin opciones · Not classified"]
  AB -->|"no"| L0{"¿L50 es cero?<br/>descanso"}
  L0 -->|"sí"| V0["cobertura total · verde<br/>no irrigation needed"]
  L0 -->|"no"| COB["cobertura = mín de 1 y D ÷ L50<br/>hectáreas = area_ha × cobertura<br/>rango: bajo con L90, alto con L10"]
  COB --> S1{"¿D cubre L90?"}
  S1 -->|"sí"| VE["verde"]
  S1 -->|"no"| S2{"¿D cubre L50?"}
  S2 -->|"sí"| AM["ámbar"]
  S2 -->|"no"| RO["rojo<br/>la ficha dice de dónde sale el resto"]
```

## 10. Indicador principal: agua ya comprometida
Kit §2.4 y C1 paso 5; código en `web/reglas.js` → `aguaComprometida` y `app.js` → `actualizarIndicador`.

```mermaid
flowchart TD
  Q0{"¿D es cero?"} -->|"sí"| M0["No dam allocation:<br/>perennial crops depend on wells or go unmet<br/>no se divide"]
  Q0 -->|"no"| AC["zona.demanda_perenne_millares de r, p50<br/>÷ D × zona.superficie_total_ha<br/>rango con p10 y p90"]
  AC --> QC{"¿pasa de la dotación completa?"}
  QC -->|"sí"| M1["Perennial crops alone ask for more than the allocation;<br/>the gap comes from wells or stays unmet<br/>enlace a Follow the drop"]
  QC -->|"no"| M2["porcentaje con su rango"]
  M1 --> QA
  M2 --> QA{"¿hay superficie abstenida?"}
  QA -->|"sí"| AL["antepone at least<br/>y muestra la superficie sin clasificar"]
  QA -->|"no"| FIN["cifra tal cual"]
  AL --> SEG["segunda cifra: X of Y fields<br/>don't have enough water for their current rotation"]
  FIN --> SEG
```

## 11. Estado del plazo del agua
S9 §5 y `motor/b4_cubo.py` (`estado_plazo`). El nogal no descuenta la edad: su compromiso se calcula siempre con `plazo.nogal_horizonte`.

```mermaid
stateDiagram-v2
  [*] --> abstenida: abstencion verdadera
  [*] --> clasificada: abstencion falsa
  abstenida --> [*]: estado_plazo null · gris
  state clasificada {
    [*] --> libre: anual o descanso · plazo.anual
    [*] --> nogal: huerta de nogal
    [*] --> alfalfa_joven: alfalfa con edad menor que plazo.alfalfa_por_vencer
    [*] --> por_vencer: alfalfa con edad desde plazo.alfalfa_por_vencer
    state "comprometida · nogal<br/>compromiso con plazo.nogal_horizonte" as nogal
    state "comprometida · alfalfa joven<br/>plazo restante = plazo.alfalfa − edad" as alfalfa_joven
    state "por vencer" as por_vencer
    alfalfa_joven --> por_vencer: pasa otro año agrícola
    por_vencer --> libre: se rompe el alfalfar · decide el agricultor
  }
```

## 12. La memoria de la parcela
Reglas sobre el NDVI mensual de HLS, una celda por año agrícola desde `memoria.anio_inicio` (S9 §5, kit A3-M). Umbrales y ventanas en `data/params.json` → `memoria.*` [S].

```mermaid
flowchart TD
  A["NDVI mensual de HLS<br/>por parcela y año agrícola"] --> B{"¿hay datos del año?"}
  B -->|"no"| SD["sin_dato"]
  B -->|"sí"| C{"¿verde con memoria.ndvi_verde<br/>durante memoria.meses_perenne<br/>dos años seguidos?"}
  C -->|"sí"| PE["perenne · alfalfa"]
  C -->|"no"| D{"¿máximo de memoria.ventana_verano<br/>llega a memoria.ndvi_verde?"}
  D -->|"sí"| E{"¿máximo de memoria.ventana_invierno<br/>llega a memoria.ndvi_verde?"}
  D -->|"no"| F{"¿máximo de memoria.ventana_invierno<br/>llega a memoria.ndvi_verde?"}
  E -->|"sí"| DO["doble"]
  E -->|"no"| VE["verano"]
  F -->|"sí"| IN["invierno"]
  F -->|"no"| DE["descanso"]
  NOG["Nogal: pierde la hoja en invierno y no cumple la regla perenne<br/>la huerta la da el mapa de cultivos 2026"] -.-> C
  A --> DES["Suelo desnudo: días con NDVI bajo suelo.ndvi_desnudo<br/>en suelo.ventana_desnudo · la ficha muestra la mediana"]
```

## 13. La gota: balance del agua
X3.1 en `motor/b4_cubo.py` (`flujos_gota`) y bandas del Sankey en `web/js/gota.js` (`bandasGota`). El balance cierra: ET + acuífero + otras = lo que sale de la presa. Se cuenta el consumo, no solo la extracción.

```mermaid
flowchart LR
  PRE["La Boquilla<br/>m3_salen_presa = llegan ÷ eficiencia.conduccion"] -->|"m3_llegan_parcela<br/>L50 de lluvia 0 × area_ha"| PAR["Field<br/>toma de la parcela"]
  PRE -->|"m3_perdidas_canal"| CAN["Canal losses"]
  PAR -->|"m3_consume_cultivo_et<br/>lámina neta × area_ha"| ET["Crop · ET"]
  PAR -->|"parte de m3_regresan_acuifero"| ACU["Back to aquifer<br/>gota.c_retorno_superficial × salen"]
  CAN -->|"parte de m3_regresan_acuifero"| ACU
  PAR -->|"parte de m3_otras_perdidas"| OTR["Other<br/>cierra el balance"]
  CAN -->|"parte de m3_otras_perdidas"| OTR
```

## 14. Estados de La gota en la ficha
Kit X3.2. Con el goteo baja lo que sale de la presa y también lo que regresa al acuífero. Sin eficiencia de goteo con fuente (`eficiencia.goteo`), el botón se muestra como no disponible.

```mermaid
stateDiagram-v2
  [*] --> actual: abrir Follow the drop · animación una vez, respeta reduced motion
  state "Riego actual · bloque gota" as actual
  state "Goteo con tope · gota_goteo_con_tope<br/>Dam water −X % · Back to aquifer −Y %" as con_tope
  state "Goteo sin tope · gota_goteo_sin_tope<br/>Crop consumption ET +Z % vs. historical" as sin_tope
  state "Goteo no disponible<br/>sin eficiencia con fuente" as no_disp
  actual --> con_tope: What if this field switches to drip?
  actual --> no_disp: eficiencia.goteo es null
  con_tope --> sin_tope: Consumption cap off
  sin_tope --> con_tope: Consumption cap on
  con_tope --> actual: volver al riego actual
  sin_tope --> actual: volver al riego actual
  note right of sin_tope
    Si tope_consumo.cumple_sin_tope es falso:
    Not recommended, district consumption
    would exceed the historical level
  end note
```

## 15. Anatomía de la ficha de parcela
Orden de los bloques en `app.js` → `construirFicha` (kit C2, X3.2 y C4).

```mermaid
flowchart TD
  F0["Encabezado<br/>id · área · cultivo con confianza o Not classified<br/>estado del plazo · edad observada"] --> F1["Frase resumen<br/>resumen.js"]
  F1 --> F2["NDVI mensual<br/>resumen.js"]
  F2 --> F3["Field memory · NASA HLS<br/>una celda por año con color y letra"]
  F3 --> F4["Suelo y relieve<br/>perfil, aptitud, pendiente, escurrimiento"]
  F4 --> F5["Evidencia<br/>altura del dosel GEDI · riesgo de helada"]
  F5 --> F6["Current rotation and alternatives<br/>tarjetas Water · Soil · Money"]
  F6 --> F7["Why?<br/>why · evidence · benefits<br/>what we don't know · risks needing local review"]
  F7 --> F8["Follow the drop"]
  F8 --> F9["Compartir<br/>Preview WhatsApp message · Print field sheet"]
  F9 --> F10["Glosario"]
  F10 --> F11["Aviso fijo<br/>This tool supports, never replaces,<br/>the judgment of farmers and local experts"]
```

## 16. Modelo de datos (contrato v4)
Kit §2.2–2.5. Se muestran las entidades y los campos que leen las pantallas; el detalle completo está en el kit.

```mermaid
erDiagram
  FEATURE ||--|| PARCELA_CUBO : "mismo id"
  FEATURE ||--o{ MEMORIA_ANIO : "memoria"
  CUBO ||--|| META : "meta"
  CUBO ||--|| DISTRITO : "distrito"
  CUBO ||--|| DOTACIONES : "dotaciones"
  DOTACIONES ||--|{ MARCA : "marcas"
  CUBO ||--|{ ZONA : "zona y zonas"
  CUBO ||--o{ PARCELA_CUBO : "parcelas"
  PARCELA_CUBO ||--o{ OPCION : "opciones"
  OPCION ||--|| AGUA : "agua"
  OPCION ||--|| SUELO_OPCION : "suelo"
  OPCION ||--o| DINERO : "dinero o null"
  OPCION ||--o{ GOTA : "gota y variantes de goteo"
  OPCION ||--o| EXPLICACION : "preguntas_ref"
  MANIFEST ||--o{ CIFRA : "cifras"
  MANIFEST ||--o{ FUENTE_ORIGEN : "fuentes_de_origen"
  FEATURE {
    string id PK
    number area_ha
    string cultivo_actual
    number prob_max
    string acuerdo_metodos
    bool abstencion
    number ftw_confianza
    bool protagonista
    int dias_suelo_desnudo_mediana
    int edad_perenne_anios
    string estado_plazo
  }
  MEMORIA_ANIO {
    int anio
    string estado "perenne verano invierno doble descanso sin_dato"
  }
  META {
    string version
    string generado
    bool mock
  }
  DOTACIONES {
    string unidad "millares_por_ha"
    string equivalencia
    object deslizador "min max paso"
    string punto_medicion
  }
  MARCA {
    string id "como_2025 como_2026 anio_normal"
    number valor
    string fuente
    string etiqueta
  }
  ZONA {
    number superficie_total_ha
    number superficie_abstenida_ha
    object demanda_perenne_millares "p10 p50 p90 por lluvia"
    object conteos
  }
  OPCION {
    string id "ACTUAL o alternativa"
    string nombre
    list secuencia
    list filtros
  }
  AGUA {
    object lamina_bruta "p10 p50 p90 por lluvia"
    object plazo_anios "min max"
    object plazo_restante "min max"
    object compromiso_millares_ha "min max por lluvia"
  }
  SUELO_OPCION {
    int dias_desnudo
    string dias_desnudo_origen "medido o estimado"
    bool leguminosa
  }
  DINERO {
    number margen_min
    number margen_max
    string fuente
  }
  GOTA {
    number m3_salen_presa
    number m3_perdidas_canal
    number m3_llegan_parcela
    number m3_consume_cultivo_et
    number m3_regresan_acuifero
    number m3_otras_perdidas
  }
  EXPLICACION {
    string llave "EXP_id_opcion"
    object textos "cinco respuestas con marcadores"
    object valores
  }
  CIFRA {
    string clave
    string fuente
    string fecha
    string script
    string etiqueta
  }
```

## 17. Las cinco pruebas a la vista
S9 §6. El resultado de cada una se publica, favorable o no, en `web/data/pruebas.json` (lo escribe `motor/pruebas_web.py`) y en About & Data. El estado vigente no se copia aquí: se lee de ese archivo.

```mermaid
flowchart LR
  subgraph Criterio["Criterio declarado antes de ver el resultado"]
    T1["1 · Mapa de cultivos<br/>F1 macro con bloques espaciales · Olofsson · abstención"]
    T2["2 · Back-test 2026 · H1 preregistrada<br/>verdad: salida de La Boquilla en el SIH"]
    T3["3 · Experimento natural 2025 · H3 preregistrada<br/>anuales caen, nogal se mantiene"]
    T4["4 · Verificador de cifras<br/>set dorado con trampas"]
    T5["5 · Contraste regional de ET y pruebas automáticas<br/>SSEBop · FAO-56 · balance de La gota"]
  end
  T1 & T2 & T3 & T4 & T5 --> PJ[("web/data/pruebas.json")]
  PJ --> AD["About & Data<br/>misma visibilidad para cualquier resultado<br/>lo no ejecutado dice not run"]
  PJ --> MD["docs/pruebas.md y README"]
```

## 18. Protocolo de revisión de cada pieza
`docs/prompts/README.md`. Solo el integrador hace commits; los revisores son de solo lectura y con contexto nuevo.

```mermaid
flowchart TD
  ESP["Especificación<br/>prompt del kit + S9 + contrato + CLAUDE.md"] --> TAR["Tareas pequeñas<br/>archivos exactos + prueba de aceptación"]
  TAR --> IMP["Implementador · contexto nuevo<br/>implementador.md · TDD · verificación"]
  IMP -->|"DONE · DONE_WITH_CONCERNS<br/>NEEDS_CONTEXT · BLOCKED"| REV["Revisor de solo lectura · contexto nuevo<br/>revisor.md · cumplimiento y calidad"]
  REV --> Q{"¿CRITICO, IMPORTANTE<br/>o NO CUMPLE?"}
  Q -->|"no"| COM["MENOR a la bitácora<br/>commit del integrador"]
  Q -->|"sí"| COR["Ciclo de corrección<br/>re_revision.md · máximo 3 rondas"]
  COR --> R1{"¿2 fallas con el mismo error?"}
  R1 -->|"sí"| RES["Prompt R1 del kit<br/>explicar en 5 líneas"]
  R1 -->|"no"| REV
  COR -->|"abiertos tras la ronda 3"| DEC["Decisión del integrador<br/>queda en docs/progreso.md"]
  COM --> FIN["Revisión final de la rama<br/>revisores en paralelo + validador por hallazgo"]
```

## 19. Plan del domingo (S10)
Horas de S10 §7 (hora de Chihuahua). El orden de corte de S10 §8 manda si hay retraso: nunca se corta la ficha con el plazo del agua y las cinco respuestas, La gota, el aviso de juicio local, el back-test ni el envío.

```mermaid
gantt
  title Domingo 15 de noviembre · hitos de S10
  dateFormat HH:mm
  axisFormat %H:%M
  section Construcción
  Solo C si A y B están listos          :c1, 07:00, 60m
  Funciones congeladas                  :milestone, m1, 08:00, 0m
  Pruebas, cifras con fuente, correcciones :c2, 09:00, 120m
  Código congelado                      :milestone, m2, 11:00, 0m
  section Envío
  Video exportado y probado en incógnito :e1, 11:00, 60m
  Revisión de cifras                    :e2, 12:00, 30m
  Primer envío                          :milestone, m3, 13:00, 0m
  Envío final                           :milestone, m4, 14:30, 0m
  section Presentación
  Montar la mesa y ensayar              :p1, 15:00, 90m
  Open House                            :p2, 17:00, 120m
```
