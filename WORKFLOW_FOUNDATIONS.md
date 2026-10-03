# Workflow Foundations

**Status:** ACTIVE
**Class:** NORMATIVE
**Purpose:** Registrar los principios estables, failure model y límites de autoridad del workflow general.

## 1. Problem being solved

El workflow está diseñado para desarrollo asistido por IA y debe asumir limitaciones reales de modelos, sesiones y herramientas:

- pérdida o compactación de contexto;
- olvido o reinterpretación de instrucciones;
- relectura innecesaria y consumo elevado de contexto;
- uso accidental de información obsoleta;
- confusión entre código temporal, experimental y aprobado;
- modificaciones fuera del alcance de una tarea;
- sobreingeniería;
- dificultad para transferir conocimiento entre sesiones o agentes;
- capacidad técnica confundida con autoridad;
- evidencia stale o ligada al estado equivocado;
- múltiples actores que interfieren o componen acciones sin autorización;
- humanos convertidos en message bus habitual.

El sistema no debe depender de que una conversación, agente, aplicación o herramienta concreta permanezca disponible.

## 2. Core authority model

La cadena de autoridad base es:

~~~text
Human
  ↓ intent / reserved decisions
Web Chat Supervisor
  ↓ bounded Work Item / review / activation
GPT Work / Implementer
  ↓ implementation / execution / evidence
Git / GitHub
  ↔ durable state and evidence
~~~

El orden expresa responsabilidad y autoridad del workflow, no una limitación técnica de acceso.

### Human Operator

Define intención de producto/workflow, resuelve decisiones materiales, autoriza permisos/credenciales y conserva por defecto la autoridad de publicación externa/producto cuando exista. Puede delegar una acción sólo de forma explícita y acotada.

### Web Chat Supervisor

Mantiene visión global, convierte intención en Work Items acotados, verifica scopes y baselines, activa perfiles subordinados cuando corresponde, revisa de forma independiente el estado exacto y decide:

~~~text
ACCEPT
REWORK
BLOCK
ESCALATE
~~~

Los vocabularios históricos `SEMANTIC_ACCEPTED` y `HOLD` pueden interpretarse sólo como provenance/compatibilidad, no como estados adicionales del core actual.

### GPT Work / Implementer

Reconstruye contexto desde GitHub y fuentes canónicas, implementa o ejecuta únicamente trabajo autorizado, verifica, revisa su diff/estado, publica evidencia y entrega handoff. No amplía autoridad, no se autoaprueba y no mergea ni publica por inferencia.

### Git / GitHub

Conservan Work Item, branches/refs, commits, diff, PR, historial, CI/checks, evidencia y decisiones durables. GitHub es el evidence plane y memoria compartida; no es una autoridad semántica autónoma.

### GoFlow

Es un helper determinista. Calcula o enruta hechos objetivos y produce señales mecánicas. No realiza aprobación semántica, no asigna autoridad y no activa perfiles por sí mismo.

## 3. Persistent memory principle

La memoria operativa debe residir principalmente en Git/GitHub y fuentes canónicas versionadas.

> Any AI participant should be replaceable without losing essential project knowledge and without requiring the previous chat transcript.

Una sesión nueva debe reconstruir el trabajo desde estado durable, no desde memoria conversacional.

## 4. Work Item principle

Todo trabajo material debe estar gobernado por un Work Item explícito y verificable.

Como mínimo debe permitir reconstruir:

- Objective;
- Acceptance Criteria;
- Authorized Scope;
- Relevant Sources;
- Verification;
- Base/baseline;
- autoridad y decisiones adicionales cuando sean materiales.

El Work Item gobierna la actividad concreta. Una herramienta, perfil, credencial o integración no puede ampliar por sí misma su Objective, Acceptance Criteria o scopes.

## 5. Three independent scopes

### Semantic Scope

Define qué comportamiento, resultado o intención puede cambiar.

Proviene principalmente de Objective + Acceptance Criteria.

### Path Scope

Define qué rutas del repositorio pueden modificarse.

Tener acceso técnico a una ruta no autoriza cualquier cambio semántico dentro de ella.

### Resource Scope

Define qué recursos no quedan expresados únicamente por una ruta de repositorio: workspace, cuenta, API, cloud, database, device, environment, artifact target, credential, provider, cost-bearing resource u otro recurso material.

Resource Scope es un campo mínimo del contrato; no crea un sistema de autoridad nuevo.

Regla:

> Una actividad material debe pasar Semantic Scope, Path Scope cuando aplique y Resource Scope cuando aplique de forma independiente.

## 6. Identity, baseline and freshness

Autorización y evidencia deben vincularse a identidad material suficiente.

Según el caso puede incluir:

- repository / branch / ref;
- Base SHA y HEAD;
- artifact/build hash;
- runtime/tool/profile version;
- environment/device identity;
- external resource identity;
- specification/version/date;
- profile lifecycle/freshness.

Un resultado válido para una identidad no se reutiliza silenciosamente para otra.

Si cambia un elemento material tras una verificación o revisión, la evidencia/decisión anterior sólo sigue siendo válida si el cambio está explícitamente demostrado como irrelevante para esa evidencia. De lo contrario, se vuelve stale y debe repetirse o revisarse.

Los hechos externos volátiles se investigan sólo cuando son materialmente necesarios. No se hardcodea “latest” como verdad permanente del workflow.

## 7. Capability is not authority

Invariante:

> `TECHNICAL CAPABILITY != WORKFLOW AUTHORITY`

Acceso a código, credenciales, cloud, device, signing, deployment, browser, filesystem, APIs, CI, merge buttons o herramientas de publicación es capacidad técnica.

La autoridad requiere una fuente explícita del workflow.

Asimismo:

- path access != semantic permission;
- credential possession != permission to use;
- test/CI/build/deploy success != approval;
- profile availability != profile activation;
- actor invocation != permission for a second operation.

## 8. Generic subordinate-profile model

El core soporta:

~~~text
CORE
+ 0..N EXPLICITLY ACTIVATED SUBORDINATE PROFILES
+ CURRENT PROJECT SPECIFICATIONS
~~~

Un **subordinate profile** es un contrato reusable para una capacidad acotada de un agente, aplicación, herramienta, plataforma, servicio u otro actor técnico.

Un **actor** es la entidad concreta que ejecuta una actividad bajo un perfil aplicable.

Reglas:

- cero perfiles es válido;
- un perfil extiende capacidad operacional pero no reemplaza el core;
- un perfil no redefine Human/Supervisor/Implementer authority;
- un perfil no se activa por detección de tecnología, archivos, credenciales, instalación o acceso;
- cada activación debe ser explícita y durable;
- una invocación concreta debe autorizar una operación mínima;
- no existe continuación automática de una operación a otra;
- `MULTIPLE PROFILES != AUTOMATIC COMPOSITION`;
- composición sólo puede ser `EXPLICIT_ONLY`;
- contradicción material o precedencia ambigua produce STOP.

## 9. Evidence model

Los reportes del agente son información útil, pero no sustituyen evidencia verificable.

Principio:

> Agent statements are reports. Repository state is evidence.

Evidencia típica:

- Git state;
- diff;
- exact SHA/ref;
- local test/check result;
- CI result;
- artifact/build identity;
- external operation result;
- environment/resource state cuando aplique.

La evidencia debe registrar limitaciones y freshness suficiente.

`PASS` es un resultado técnico. No equivale a `ACCEPT`.

## 10. Independent review and decisions

El Implementer puede auto-verificar su trabajo, pero no autoaprobarlo.

El Supervisor revisa independientemente intención, scopes, estado exacto, diff/resultado, evidencia, complejidad y riesgos pertinentes.

Decisiones core:

- `ACCEPT` — la propuesta satisface semánticamente el Work Item para el estado revisado;
- `REWORK` — requiere corrección manteniendo el objetivo;
- `BLOCK` — existe un impedimento objetivo que impide continuar válidamente;
- `ESCALATE` — se requiere autoridad o decisión superior/material.

Una nueva revisión debe identificar el estado exacto al que aplica.

## 11. Merge and publication boundaries

`ACCEPT` no implica merge.

Merge requiere autoridad separada y comprobaciones de integración vigentes. Ningún Implementer o perfil subordinado obtiene merge authority por capacidad, tests o aceptación.

Cuando existe publicación externa/producto:

- Human authority es el default;
- cualquier delegación debe ser explícita;
- deploy/staging/upload/build capability no implica publication authority;
- Publish nunca se infiere de `ACCEPT`, CI, merge, credenciales o capacidad técnica.

## 12. STOP and recovery

Ante contradicción material de:

- autoridad;
- Objective/Acceptance Criteria;
- Semantic/Path/Resource Scope;
- Base SHA/baseline/version;
- repository/resource identity;
- profile activation;
- credential/cost permission;
- freshness;
- composition/precedence;

la regla es:

~~~text
STOP
→ persist evidence/blocker
→ return control to Supervisor
→ Human decision if reserved/material
~~~

Recovery normal reconstruye el estado desde fuentes durables verificables. No inventa, recrea ni sustituye una identidad/baseline de forma implícita.

La mecánica concreta de recovery pertenece al proyecto o perfil cuando sea específica de una plataforma/canal.

## 13. Short prompts and selective reading

Los prompts de entrada deben ser cortos y dirigir al agente a fuentes persistentes.

Patrón:

~~~text
Work Item
→ current authority/baseline
→ project specifications
→ explicitly activated profiles
→ indexed relevant sources
→ affected code/tests/resources
~~~

No se lee todo el repositorio automáticamente. El contexto se amplía sólo cuando existe una dependencia material.

## 14. Prototype-oriented engineering

La prioridad es resolver el objetivo con la solución más simple que preserve corrección, evidencia y autoridad.

El workflow debe frenar:

- infraestructura especulativa;
- frameworks auxiliares innecesarios;
- registros/runtime services sin necesidad observada;
- automatización prematura;
- duplicación de documentación;
- controles de plataforma copiados por simetría.

Una nueva capacidad de GoFlow o del workflow requiere una necesidad operacional observada y un Work Item separado.

## 15. Current truth versus history

Debe distinguirse claramente:

- current/active;
- proposal;
- experiment;
- evidence;
- superseded/deprecated;
- historical/provenance.

La mera existencia de un archivo, comentario, perfil, integración o branch no demuestra que sea autoridad vigente.

Los hechos actuales se expresan de forma positiva y se mantienen en una fuente canónica. Git conserva el historial.

## 16. Deterministic software versus AI

Software determinista puede calcular:

- Git state;
- SHA/ref;
- path scope;
- configured checks;
- CI status;
- document existence/routing;
- staleness signals;
- review package facts.

La IA se reserva principalmente para:

- intención;
- arquitectura;
- planificación;
- implementación;
- diagnóstico;
- evaluación semántica;
- conflicto/precedencia;
- decisiones bajo autoridad.

Automatizar un hecho no transfiere autoridad al software que lo calcula.

## 17. Core invariants

~~~text
GITHUB/DURABLE STATE > SESSION MEMORY
EVIDENCE != APPROVAL
TECHNICAL CAPABILITY != WORKFLOW AUTHORITY
PATH PERMISSION != SEMANTIC PERMISSION
PROFILE AVAILABILITY != PROFILE ACTIVATION
MULTIPLE PROFILES != AUTOMATIC COMPOSITION
ACCEPT != MERGE AUTHORITY
DEPLOY/PUBLISH CAPABILITY != PUBLICATION AUTHORITY
NEW MATERIAL BASELINE != OLD EVIDENCE BY DEFAULT
STOP ON MATERIAL AUTHORITY/SCOPE/BASELINE CONFLICT
~~~
