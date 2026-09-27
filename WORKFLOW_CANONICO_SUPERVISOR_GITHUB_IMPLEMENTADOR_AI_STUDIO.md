# Workflow canónico — Supervisor + GitHub + Agente implementador + AI_STUDIO_OPERATOR + LOCAL_AGENT_OPERATOR

> **Estado:** workflow canónico activo del proyecto desde la integración de Issue #47 mediante PR #49 en `main@866d7aaa793cb9d1a2675965f911c6ddb37275e9`.
>
> **Baseline:** `WORKFLOW_SIMPLIFICADO_CHAT_WEB_GPT_GEMINI_3_8.md` en `main@ff1a7d46c3f9992adbcc41b933cc13c3501fc617` (blob `d6fd666d5be7659784f6f20021ba4a3515d45f14`).
>
> **Base de consolidación validada:** historial aceptado por el Supervisor en Issue #47, comentario `issuecomment-5851766362`.
>
> **Regla de consolidación:** preservar la función y significado del baseline; incorporar únicamente mejoras ya canónicas o reglas operativas verificadas y persistidas. No importar recomendaciones no adoptadas.

## Estado de procedencia

Ya están integradas en el baseline y se preservan sin reimplementarlas:

- Issue #4 / PR #5 — autoridad de merge del Supervisor;
- Issue #26 / PR #27 — GitHub Actions como CI persistente y CI como evidencia;
- Issue #32 / PR #33 — `AI_STUDIO_OPERATOR` subordinado y no-write;
- Issue #36 / PR #38 — contrato residente, bootstrap/recovery, `CANONICAL_GIT_CHECKOUT`, `MANAGED_PREVIEW_ROOT`, materialización one-way, cwd/process safety, SHA Gate, PUBLISH y reporting.

Reglas operativas verificadas que estaban pendientes de integración canónica antes de la consolidación de Issue #47:

- Issue #35 — `RESEARCH_GATE + STRATEGIC_RATIONALE`;
- Issue #39 — `TECHNICAL PERMISSION != WORKFLOW AUTHORITY` y `AI_STUDIO_ALLOWED_REPOSITORY_WRITES = NONE`.

Issue #35 y Issue #39 permanecen OPEN. Antes de PR #49 sus reglas eran operativamente vigentes pero todavía no estaban integradas canónicamente; quedaron incorporadas a este workflow mediante la integración de Issue #47. Su estado OPEN no equivale a ausencia de esa integración y su cierre conserva su propio lifecycle.

El registro `recomendaciones/MEJORAS_WORKFLOW.md` es provenance de recomendaciones. Según la revisión histórica validada en #47, sólo la recomendación de CI fue adoptada mediante #26; las restantes recomendaciones no se importan por el solo hecho de estar documentadas.

## 1. Objetivo

Este workflow organiza el trabajo colaborativo entre:

- **Chat Web GPT**: planificación, arquitectura, definición de tareas y revisión.
- **Agente implementador**: implementación y escritura técnica mediante Codespaces/terminal u otro canal de implementación expresamente autorizado.
- **AI_STUDIO_OPERATOR**: Google AI Studio web para operación externa read/test/publish, sin escritura de código ni repositorio.
- **LOCAL_AGENT_OPERATOR**: verificación y diagnóstico local autorizados, sin escritura de código/producto; protocolo en §32.
- **GitHub**: memoria persistente, tareas, código, evidencia y coordinación.
- **Humano**: intención del producto, prioridades, permisos y decisiones excepcionales.

No utiliza GoFlow ni una mini aplicación auxiliar.

La idea principal es:

```text
Chat Web GPT
    ↓ define trabajo
GitHub Issue
    ↓
Agente implementador
    ↓ implementa + verifica
GitHub Branch / Commit / PR
    ↓
Chat Web GPT
    ↓ revisión
ACCEPT / REWORK / ESCALATE
```

GitHub reemplaza el chat como memoria compartida.

---

# 2. Principio fundamental

> **Las conversaciones son temporales. GitHub y los documentos del proyecto son persistentes.**

Ni Chat Web GPT ni Agente implementador deben depender de recordar conversaciones anteriores.

Una sesión nueva debe poder reconstruir el trabajo con:

```text
Repositorio
+ Issue
+ branch / PR
+ documentación técnica
```

No necesita recibir todo el transcript anterior.

---

# 3. Responsabilidades

## 3.1 Chat Web GPT

Es el **Supervisor técnico**.

Responsabilidades:

- entender la intención del humano;
- estudiar el proyecto completo cuando sea necesario;
- razonar sobre arquitectura;
- identificar impacto;
- dividir trabajo en tareas pequeñas;
- crear o definir el Work Item;
- indicar documentación relevante;
- revisar PR, diff y evidencia;
- detectar cambios fuera de alcance;
- detectar sobreingeniería;
- solicitar REWORK;
- aceptar semánticamente el cambio.

No implementa normalmente el código de la tarea que posteriormente revisará.

Su foco es:

```text
pensar
planificar
delimitar
revisar
decidir
```

---

# 4. Agente implementador

Es el **desarrollador** del workflow canónico. Implementa mediante Codespaces/terminal u otro canal de implementación expresamente autorizado; conserva las responsabilidades de branch, commit y PR definidas en esta sección.

No es `AI_STUDIO_OPERATOR` y Google AI Studio web no ejerce el rol implementador bajo este protocolo.

Responsabilidades:

- leer el Issue;
- recuperar únicamente el contexto necesario;
- revisar la documentación relevante;
- comprobar el estado del repositorio;
- crear o utilizar la branch indicada;
- implementar únicamente el alcance autorizado;
- ejecutar las pruebas correspondientes;
- revisar su propio diff;
- commit;
- push;
- abrir o actualizar PR;
- informar resultados.

Su foco es:

```text
leer contexto acotado
implementar
probar
revisar diff
publicar evidencia
```

No debe:

- redefinir arquitectura por iniciativa propia;
- ampliar el alcance silenciosamente;
- corregir problemas no relacionados;
- declarar su propio trabajo aprobado;
- hacer merge sólo porque los tests pasaron.

---

# 5. GitHub

GitHub es el centro del sistema.

Guarda:

```text
Issue
→ intención concreta y alcance

Branch
→ trabajo aislado

Commit
→ estado exacto del código

Pull Request
→ propuesta de integración

Diff
→ evidencia del cambio

CI
→ evidencia automatizada, cuando exista

Comentarios de review
→ REWORK / aceptación / decisiones

Git history
→ historial
```

Regla:

> **Lo dicho por un modelo es un reporte. El repositorio es la evidencia.**

---

# 6. Documentación del proyecto

El workflow canónico utiliza la documentación normal del producto:

```text
README.md

docs/engineering/
├── SOFTWARE_REQUIREMENTS_SPECIFICATION.md
├── SOFTWARE_ARCHITECTURE.md
├── TECHNICAL_SPECIFICATION.md
├── VERIFICATION_SPECIFICATION.md
└── adr/
```

El workflow no se copia dentro de esos documentos.

La documentación describe la aplicación.

El workflow describe cómo trabajan las personas y modelos sobre ella.

---

# 7. Unidad de trabajo: GitHub Issue

Cada tarea suficientemente importante debe existir como un Issue.

Formato simplificado:

```markdown
## Objective

Qué debe conseguir esta tarea.

## Acceptance Criteria

Qué condiciones deben cumplirse.

## Authorized Scope

Qué archivos o módulos puede modificar.

## Relevant Sources

Qué documentación debe leer.

## Verification

Qué pruebas o comprobaciones debe realizar.

## Base

Branch o commit desde el que comienza el trabajo.
```

No necesitamos la gramática rígida utilizada por GoFlow.

Pero sí necesitamos que estas seis partes sean claras.

---

# 8. Dos tipos de scope

Aunque no exista GoFlow, seguimos utilizando dos límites.

## Semantic Scope

Proviene de:

```text
Objective
+
Acceptance Criteria
```

Define:

> qué comportamiento está autorizado a cambiar.

## Path Scope

Proviene de:

```text
Authorized Scope
```

Define:

> qué archivos o módulos puede modificar.

Para que un cambio sea válido debe cumplir ambos.

Ejemplo:

```text
Authorized Scope:
src/auth/**
```

no significa:

```text
puede cambiar cualquier regla de autenticación.
```

El comportamiento también debe estar autorizado por Objective y Acceptance Criteria.

---

# 9. Flujo completo

## Fase A — intención

El humano explica qué quiere conseguir.

```text
Humano
↓
Chat Web GPT
```

Chat Web GPT analiza:

- objetivo;
- arquitectura;
- módulos afectados;
- riesgos;
- alcance;
- verificación necesaria.

---

## Fase B — creación del Work Item

Chat Web GPT prepara el Issue.

Debe ser suficientemente pequeño para que el Agente implementador pueda ejecutarlo sin reconstruir todo el proyecto.

Idealmente:

```text
1 Issue
→ 1 objetivo
→ 1 branch
→ 1 PR
```

Es un default, no una obligación absoluta.

---

# 10. Inicio del Agente implementador

El mensaje inicial puede ser extremadamente corto:

```text
Repositorio: <owner/repo>
Work Item: #123

Ejecuta la tarea según el Issue y la documentación canónica.
No amplíes el alcance.
Publica el PR y la evidencia cuando esté listo para revisión.
```

El prompt no transporta la especificación completa.

---

# 11. Bootstrap del Agente implementador

Antes de modificar código debe responder internamente estas preguntas:

1. ¿Cuál es el objetivo del Issue?
2. ¿Cuáles son los Acceptance Criteria?
3. ¿Qué comportamiento está autorizado a cambiar?
4. ¿Qué rutas están autorizadas?
5. ¿Qué documentos debo leer?
6. ¿Qué módulo es responsable de este comportamiento?
7. ¿Qué interfaces podría afectar?
8. ¿Qué pruebas debo ejecutar?
9. ¿Cuál es la branch/base correcta?
10. ¿Existen cambios previos que no pertenecen a esta tarea?

Si no puede responder una pregunta material, debe detenerse y pedir aclaración.

---

# 12. Política de lectura

Agente implementador no debe leer todo el repositorio automáticamente.

Orden recomendado:

```text
Issue
↓
README si necesita orientación
↓
secciones relevantes de SRS
↓
Architecture del módulo
↓
Technical Specification pertinente
↓
Verification Plan pertinente
↓
código y tests afectados
```

Sólo amplía contexto cuando encuentra una dependencia real.

---

# 13. Implementación

Durante la implementación:

- modificar únicamente lo necesario;
- mantener comportamiento no relacionado;
- no realizar refactors oportunistas;
- no introducir frameworks o dependencias sin necesidad;
- no crear infraestructura futura;
- respetar contratos existentes;
- mantener el cambio fácil de revisar.

Para prototipos:

> **La solución más simple que cumple correctamente el requisito normalmente es preferible.**

---

# 14. Problemas descubiertos durante el trabajo

Si el Agente implementador encuentra otro problema:

```text
Problema relacionado directamente
→ puede corregirse si está dentro del scope.

Problema no relacionado
→ se reporta.

Problema que requiere ampliar scope
→ se detiene y solicita decisión.
```

No debe existir:

```text
“Ya que estoy aquí también arreglé…”
```

---

# 15. Verificación local

Antes de publicar:

```text
implementar
↓
ejecutar tests relevantes
↓
corregir
↓
volver a ejecutar
↓
revisar diff completo
```

Debe comprobar:

- tests;
- archivos cambiados;
- archivos nuevos;
- cambios accidentales;
- contratos afectados;
- documentación que realmente deba cambiar.

---

# 16. Publicación

Cuando el cambio esté listo:

```text
commit
↓
push
↓
PR
```

El PR debe permitir identificar:

```text
Issue
branch
commit SHA
qué cambió
qué pruebas se ejecutaron
limitaciones conocidas
```

---

# 17. Handoff del Agente implementador

El mensaje final debe ser breve.

Ejemplo:

```text
WORK ITEM: #123
PR: #145
COMMIT: abc1234
VERIFICATION: PASS
CI: PASS / NOT CONFIGURED / PENDING
STATE: READY_FOR_REVIEW
UNEXPECTED FINDING: none
```

No necesita escribir una explicación extensa de todo el desarrollo.

Chat Web GPT puede reconstruir el detalle desde GitHub.

---

# 18. Revisión de Chat Web GPT

Chat Web GPT no debe aceptar simplemente porque el Agente implementador diga que terminó.

Debe revisar independientemente:

- Issue;
- Objective;
- Acceptance Criteria;
- diff;
- archivos cambiados;
- arquitectura;
- interfaces;
- dependencias;
- tests;
- documentación;
- PR;
- SHA;
- CI cuando exista.

Y responder una de estas decisiones:

```text
SEMANTIC_ACCEPTED
REWORK
HOLD
ESCALATE
```

---

# 19. Significado de las decisiones

## SEMANTIC_ACCEPTED

El cambio satisface la intención del Work Item para el SHA revisado.

No significa automáticamente merge.

## REWORK

Existe una corrección necesaria dentro del mismo objetivo.

Normalmente continúa:

```text
mismo Issue
misma branch
mismo PR
```

## HOLD

Existe un impedimento objetivo que no puede resolverse actualmente.

Ejemplo:

```text
dependencia externa caída
credencial técnica no disponible
conflicto que impide continuar
```

## ESCALATE

Se requiere una decisión humana.

Ejemplos:

```text
cambio de alcance
decisión de producto
permiso
credencial
trade-off material
excepción importante
```

---

# 20. REWORK

Chat Web GPT debe escribir en el PR:

```text
Problema observado:
...

Resultado requerido:
...

Evidencia:
...

Scope:
permanece / cambia
```

Agente implementador:

```text
lee comentario
↓
corrige
↓
verifica
↓
nuevo commit
↓
push
↓
nuevo handoff
```

Un nuevo commit invalida cualquier aceptación anterior correspondiente a otro SHA.

---

# 21. Decisión vigente

Cuando existan varios comentarios antiguos:

> **La decisión vigente es la última decisión de Chat Web GPT asociada explícitamente al HEAD actual.**

Ejemplo:

```text
SHA A → REWORK
SHA B → REWORK
SHA C → SEMANTIC_ACCEPTED
SHA D → nuevo commit
```

La aceptación de C no autoriza D.

D debe revisarse nuevamente.

---

# 22. CI

El proyecto adopta **GitHub Actions como CI mínimo persistente** mediante Issue #26. El workflow canónico está en:

```text
.github/workflows/ci.yml
```

Su objetivo es producir evidencia mecánica reproducible asociada al SHA verificado. Ejecuta los comandos canónicos del repositorio:

```text
npm ci
npm run build
npm test
git diff --check <base>...<HEAD>
```

El workflow se ejecuta automáticamente para Pull Requests cuyo target es `main`. Para PR, la verificación debe corresponder al **HEAD exacto del PR** y usar como base la revisión de `main` indicada por el evento.

También define `workflow_dispatch` para verificación manual por `ref`/SHA y base de comparación, con `main` como base por defecto. GitHub sólo permite recibir `workflow_dispatch` cuando el archivo de workflow existe en la rama por defecto; por ello esta capacidad manual queda disponible después de integrar el workflow en `main`. Una ejecución manual contra otro PR no modifica el HEAD de ese PR.

El CI mínimo usa únicamente un runner GitHub-hosted Linux estándar, sin secrets del proyecto, caché, artefactos, deploy ni larger runners. Cualquier ampliación requiere un Work Item separado.

Estados de CI:

```text
PASS
FAIL
PENDING
NOT CONFIGURED
```

`PASS` es evidencia automática para el SHA indicado.

No significa aprobación ni equivale a `SEMANTIC_ACCEPTED`.

Si el proyecto requiere CI y está:

```text
FAIL
PENDING
```

el cambio todavía no está listo para integración.

---

# 23. Integración

Secuencia conceptual:

```text
READY_FOR_REVIEW
↓
SEMANTIC_ACCEPTED
↓
verificar estado actual de target branch
↓
MERGE_ELIGIBLE
↓
MERGED
↓
CLOSED
```

Antes del merge se confirma que:

- HEAD sigue siendo el revisado;
- no apareció un conflicto relevante;
- CI requerido sigue válido;
- no existe un blocker nuevo.

---

# 24. Merge

En este proyecto, **Chat Web GPT, como Supervisor técnico, ejecuta el merge del PR mediante la integración disponible**. La decisión humana vigente asigna esa autoridad a Chat Web GPT; no queda como una lista de actores posibles.

Antes de ejecutar el merge, Chat Web GPT verifica que:

- el HEAD del PR sigue siendo exactamente el SHA con `SEMANTIC_ACCEPTED`;
- la rama destino está vigente y el PR no tiene conflictos;
- no hay impedimentos ni blockers nuevos;
- el CI requerido, cuando exista, está válido para ese SHA.

`SEMANTIC_ACCEPTED` confirma que el cambio satisface el Work Item para el SHA revisado, pero no declara por sí solo que el PR está `MERGE_ELIGIBLE` ni autoriza al Agente implementador a ejecutarlo. `MERGE_ELIGIBLE` registra que se comprobaron las condiciones de integración. La decisión humana registrada en este workflow autoriza a Chat Web GPT a ejecutar el merge únicamente después de esas comprobaciones.

El Agente implementador no se autoaprueba ni ejecuta el merge.

---

# 25. Cambio de sesión del Agente implementador

Si desaparece la sesión del Agente implementador:

La nueva sesión recibe solamente:

```text
Repositorio
Issue
```

y reconstruye:

```text
Issue
↓
branch
↓
HEAD
↓
PR
↓
últimos comentarios
↓
documentación relevante
↓
código
↓
tests
```

No necesita transcript anterior.

Debe responder nuevamente las diez preguntas de bootstrap antes de continuar.

---

# 26. Cambio de sesión de Chat Web GPT

Una sesión nueva de Chat Web GPT debe reconstruir:

1. ¿Qué producto se está desarrollando?
2. ¿Cuál es la arquitectura relevante?
3. ¿Qué Work Item está activo?
4. ¿Cuál es el objetivo?
5. ¿Qué scope fue autorizado?
6. ¿Cuál es el HEAD actual?
7. ¿Qué cambió realmente?
8. ¿Qué evidencia corresponde a ese SHA?
9. ¿Cuál es la última decisión válida para ese SHA?
10. ¿Qué decisión debe tomar ahora el Supervisor?

Tampoco necesita transcript anterior.

---

# 27. Rol del humano

El humano interviene principalmente para:

```text
intención
prioridades
decisiones de producto
cambio material de scope
credenciales
permisos
trade-offs importantes
```

No debería tener que copiar:

- diffs;
- código;
- contexto técnico;
- resultados extensos;

entre Chat Web GPT y el Agente implementador.

Un mensaje humano ideal puede ser simplemente:

```text
Agente implementador: trabaja Issue #123.
```

o:

```text
Chat Web GPT: revisa PR #145.
```

---

# 28. Reglas esenciales

El workflow canónico puede resumirse en diez reglas:

1. GitHub es la memoria compartida.
2. El Issue define la tarea.
3. La documentación define el producto y su ingeniería.
4. El Agente implementador implementa; Chat Web GPT revisa.
5. El Agente implementador no se autoaprueba.
6. Scope significa comportamiento autorizado + rutas autorizadas.
7. Una decisión de review sólo vale para el SHA revisado.
8. Tests/CI son evidencia, no aprobación.
9. REWORK del mismo objetivo permanece en el mismo Issue/PR.
10. Una sesión nueva reconstruye desde GitHub; no desde el transcript anterior.

---


# 29. AI_STUDIO_OPERATOR — protocolo subordinado de operación externa

Esta sección añade un rol operativo externo sin sustituir las reglas generales ya definidas para Issue, scopes, implementador, revisión por SHA, decisiones del Supervisor, CI, integración, merge y Humano.

> **AI_STUDIO_OPERATOR no es el Agente implementador y Google AI Studio web no puede ejercer el rol implementador bajo este protocolo.**

El Agente implementador conserva la escritura canónica por branch/commit/PR. `AI_STUDIO_OPERATOR` es invocado por el Supervisor para producir evidencia operacional o ejecutar una publicación autorizada.

```text
                         ┌→ Agente implementador → branch/commit/PR → GitHub
Humano → Supervisor → GitHub
                         └→ AI_STUDIO_OPERATOR → evidencia/publicación → Supervisor/GitHub
```

GitHub continúa siendo la fuente persistente de verdad. AI Studio no crea una ruta paralela `AI Studio → code → GitHub`.

El contrato de ejecución residente es [`AI_STUDIO_OPERATOR.md`](AI_STUDIO_OPERATOR.md). AI Studio debe leerlo desde el mismo SHA que está verificando antes de ejecutar una tarea dependiente del código. Ese archivo es subordinado a este workflow: no puede ampliar permisos, scope, autoridad ni estados formales. Ante contradicción, prevalece este workflow.

**NEW CHAT BOOTSTRAP:** un chat nuevo de AI Studio reconstruye contexto desde GitHub + Work Item + documentación canónica, no desde el transcript previo. Antes de trabajo consecuencial debe completar el bootstrap residente: establecer rol/autoridad, objetivo, TASK, MODE, EXPECTED SHA, evidencia esperada y límites; verificar checkout/HEAD/worktree y managed Preview root/runtime cuando aplique; y declarar la única operación, STOP conditions y evidencia a retornar. Sólo después puede actuar.

## 29.1 Permission Matrix

| Capacidad | AI_STUDIO_OPERATOR |
|---|---|
| READ / OBSERVE | YES |
| PULL / SYNC FROM GITHUB | YES, sólo para consumir/importar una versión |
| PREVIEW | YES |
| TEST | YES |
| DIAGNOSE | YES |
| PUBLISH external operational state | YES, sólo bajo protocolo PUBLISH |
| SPIKE_READ_ONLY | YES |
| repository/product-code write | NO |
| WRITE CANONICAL | NO |
| Fix / APPLY FIX | NO |
| COMMIT / PUSH | NO |
| CREATE / MODIFY BRANCH OR PR | NO |
| MERGE | NO |
| CHANGE DEPENDENCIES | NO |
| CHANGE SCHEMA / PROMPTS / WORKFLOW | NO |
| CHANGE REPOSITORY SECRETS | NO |
| ADOPT INTEGRATION | NO sin decisión humana + Issue |

`PULL / SYNC` nunca autoriza sincronización de cambios de vuelta al repositorio. Para repositorios públicos, la vía preferida es clone/fetch HTTPS anónimo, sin token, preservando `.git` y verificando `origin`, HEAD exacto y worktree limpio. Esto no exige integración GitHub nativa ni sync bidireccional.

## 29.2 Inicio: AI_STUDIO_REQUEST

Toda intervención usada como evidencia del workflow comienza por solicitud explícita del Supervisor y un Work Item existente.

Antes de una tarea dependiente del código, AI Studio debe obtener/refrescar la copia Git read-only, verificar `origin`, `EXPECTED SHA`, worktree limpio, leer `AI_STUDIO_OPERATOR.md` desde ese mismo SHA e identificar explícitamente `CANONICAL_GIT_CHECKOUT` y, cuando aplique, `MANAGED_PREVIEW_ROOT`. Sólo entonces puede ejecutar el `TASK`.

El checkout Git usado para verificar SHA y la raíz administrada que alimenta el Preview pueden ser distintos. Verificar un clone exacto **no prueba** que el Preview visible use ese árbol.

```text
AI_STUDIO_REQUEST

WORK ITEM: #<issue>
MODE: OBSERVE | PREVIEW | TEST | DIAGNOSE | PUBLISH | SPIKE_READ_ONLY
EXPECTED SHA: <sha> | N/A (platform-only)
TARGET: <preview / route / deployment / platform capability>
CANONICAL_GIT_CHECKOUT: <absolute path when code-dependent>
MANAGED_PREVIEW_ROOT: <absolute path when Preview/Publish-dependent>
TASK: <una sola operación concreta>
PRECONDITIONS: <observable conditions>
STOP CONDITIONS: <conditions that force BLOCKED/return>

FORBIDDEN:
- edit code/files
- Fix
- commit / branch / PR / push / merge
- dependency / schema / prompt / workflow changes
- repository secret changes

RETURN:
- OBSERVED SHA
- RESULT: PASS | FAIL | BLOCKED
- CLASSIFICATION
- EVIDENCE
- ERROR exacto si existe
```

`EXPECTED SHA: N/A (platform-only)` sólo se usa para `SPIKE_READ_ONLY` puramente de plataforma que no dependa de una versión del código.

## 29.3 Modos y disciplina de prompts

- `OBSERVE`: inspeccionar estado visible sin modificarlo.
- `PREVIEW`: ejecutar preview del SHA autorizado.
- `TEST`: ejecutar una comprobación concreta.
- `DIAGNOSE`: reproducir y aislar un fallo sin aplicar corrección.
- `PUBLISH`: publicar exclusivamente el SHA autorizado por el Supervisor.
- `SPIKE_READ_ONLY`: estudiar una capacidad/integración sin adoptarla.

Una operación real que cambie estado por prompt. Puede incluir verificación antes/después, pero no combinar diagnose + repair + publish. No usar tareas abiertas como “arregla todo” o “actualiza la interfaz”. `Fix` permanece prohibido.

Plantillas mínimas:

```text
MODE: TEST
EXPECTED SHA: <sha>
TASK: ejecutar <prueba concreta>; reportar resultado/evidencia; no modificar archivos.
```

```text
MODE: DIAGNOSE
EXPECTED SHA: <sha>
TASK: reproducir <fallo concreto>; capturar error exacto; clasificar; no aplicar Fix.
```

```text
MODE: PUBLISH
EXPECTED SHA: <approved-sha>
TASK: importar/sincronizar ese SHA; confirmar SHA; smoke preview; publish; smoke público; no modificar código.
```

## 29.4 SHA Gate

Es obligatorio antes de:

- `PREVIEW`;
- `TEST`;
- `DIAGNOSE` sobre código;
- `PUBLISH`.

```text
EXPECTED SHA == OBSERVED SHA
```

Si no coincide:

```text
STOP
RESULT: BLOCKED
CLASSIFICATION: AI_STUDIO_ENVIRONMENT
REASON: SHA_MISMATCH
```

No se continúa la operación ni se declara defecto de código.

Para `PREVIEW` y `PUBLISH`, el SHA Gate no termina en el checkout: también debe identificarse el `MANAGED_PREVIEW_ROOT` y demostrarse, por una vía soportada, que el árbol aprobado fue materializado unidireccionalmente allí. No se inventan/sustituyen archivos ni se sincroniza de vuelta a GitHub. Un HTTP 200 por sí solo no prueba que el Preview visible corresponda al SHA autorizado.

## 29.5 Ventanas de intervención

- **Antes/durante implementación:** `OBSERVE`, `SPIKE_READ_ONLY` o diagnóstico de plataforma/capacidad. AI Studio no implementa.
- **Branch/PR:** `PREVIEW`, `TEST` o `DIAGNOSE` sólo por solicitud del Supervisor y con el HEAD exacto como `EXPECTED SHA`.
- **Revisión:** puede aportar evidencia; `PASS` no equivale a `SEMANTIC_ACCEPTED` y `FAIL` no equivale por sí solo a `REWORK`.
- **Post-merge/publicación:** `PUBLISH` sólo para el SHA autorizado explícitamente por el Supervisor.

Las decisiones formales continúan bajo las reglas de revisión existentes; AI Studio sólo reporta `PASS / FAIL / BLOCKED`.

## 29.6 Clasificación y diagnóstico

Toda falla se clasifica provisionalmente como:

```text
CODE
AI_STUDIO_ENVIRONMENT
DEPLOYMENT
EXTERNAL_SERVICE
UNKNOWN
```

- `CODE`: evidencia de defecto en el mismo SHA.
- `AI_STUDIO_ENVIRONMENT`: sync, instalación, preview, runtime o estado interno de AI Studio.
- `DEPLOYMENT`: fallo durante preparación/publicación/serving con origen aún por determinar.
- `EXTERNAL_SERVICE`: servicio/proveedor externo indisponible, limitado o rechazando la operación.
- `UNKNOWN`: evidencia insuficiente.

```text
confirm SHA → reproduce → capture exact error → classify → report → no automatic fix
```

La clasificación es evidencia provisional. El Supervisor aplica las decisiones `REWORK / HOLD / ESCALATE` según las reglas generales ya existentes. Un problema de entorno/plataforma no se convierte automáticamente en `REWORK` de código.

Reglas operativas verificadas, detalladas en `AI_STUDIO_OPERATOR.md`:

- **cwd:** toda operación dependiente del proyecto usa path absoluto, `cd <absolute-path> && ...` o equivalente; si el launcher ejecuta desde otra raíz, `BLOCKED / AI_STUDIO_ENVIRONMENT`.
- **process safety:** identificar PID/comando/cwd exactos, preferir cierre graceful, no usar listas amplias de PID ni loops de takeover de puerto; respawn administrado implica `STOP / BLOCKED`.
- **recovery:** ante `Canceled`, `An internal error occurred`, respuesta stale/repetida o fallo de tool/workspace: salir/volver atrás → reingresar al proyecto → `NEW CHAT` → comprobar únicamente `git rev-parse HEAD`, `git status --short` y `GET /api/health`; continuar sólo con SHA correcto, worktree limpio y health válido.
- si la recuperación falla, puede probarse sesión fresca/privada o Remix/workspace fresco como recuperación de entorno; sin evidencia de defecto de aplicación no se clasifica automáticamente como `CODE`.
- `BLOCKED` significa detenerse, no improvisar y devolver control al Supervisor.

## 29.7 Protocolo PUBLISH

```text
approved GitHub SHA
→ AI_STUDIO_REQUEST MODE=PUBLISH
→ pull/sync/import desde GitHub
→ SHA Gate
→ identificar CANONICAL_GIT_CHECKOUT y MANAGED_PREVIEW_ROOT
→ demostrar materialización one-way del árbol aprobado en el managed root
→ preview smoke test
→ publish
→ public smoke test
→ AI_STUDIO_REPORT
→ evidencia persistida en GitHub
→ control vuelve al Supervisor
```

Distinción obligatoria:

```text
repository/product-code write: NO
authorized external PUBLISH: YES
```

`PUBLISH` nunca autoriza `Fix`, edición de código, dependencias, repository secrets, commit, push, PR o merge.

Si publicar exige escritura del proyecto:

```text
STOP → ESCALATE → decisión humana → nuevo Work Item
```

## 29.8 SPIKE_READ_ONLY para integraciones Google

```text
SPIKE_READ_ONLY
→ inspeccionar capacidad/documentación/configuración visible
→ AI_STUDIO_REPORT
→ Supervisor review
→ Human decision
→ Issue
→ implementación canónica por el Agente implementador
```

Puede reportar OAuth/scopes esperados, configuración visible, secretos previsiblemente necesarios **sin leer/copiar valores**, archivos potencialmente afectados y limitaciones de plataforma.

Ver o pulsar una capacidad de integración no autoriza su adopción. Si el spike requiere escribir/generar cambios del proyecto, se detiene y escala.

## 29.9 Regla absoluta de no escritura

```text
AI Studio may read, run, test, diagnose and publish.
AI Studio may not write product code or repository state.
```

Prohibido: editar archivos; aplicar `Fix`; commit; branch; PR; push; merge; cambiar dependencias, schema, prompts, workflow o repository secrets.

La preparación efímera interna para ejecutar Preview sólo es admisible si no modifica ni sincroniza archivos de vuelta a GitHub. Puede instalar dependencias ya declaradas desde el lockfile/manifiestos del SHA aprobado, iniciar/reiniciar servicios permitidos y materializar unidireccionalmente el árbol aprobado al workspace administrado por una vía soportada. Eso no concede autoridad para cambiar dependencias ni archivos canónicos.

`WRITE_SANDBOX: NO AUTORIZADO`.

Cualquier necesidad futura de escritura exige:

```text
STOP → ESCALATE → decisión humana explícita → nuevo Work Item
```

## 29.10 Fin: AI_STUDIO_REPORT y evidencia

Toda intervención termina con:

```text
AI_STUDIO_REPORT

WORK ITEM: #<issue>
MODE: <mode>
EXPECTED SHA: <sha> | N/A (platform-only)
OBSERVED SHA: <sha> | N/A (platform-only)
RESULT: PASS | FAIL | BLOCKED
CLASSIFICATION: CODE | AI_STUDIO_ENVIRONMENT | DEPLOYMENT | EXTERNAL_SERVICE | UNKNOWN
EVIDENCE: <mínima y verificable>
ERROR: <exacto o none>
CODE/REPOSITORY MODIFIED: NO
```

Después del reporte:

```text
control → Supervisor
```

La evidencia sólo adquiere persistencia para el workflow cuando se registra en el Issue o PR correspondiente, asociada al Work Item, modo, SHA aplicable, resultado, clasificación y evidencia concreta. Cuando sea relevante debe incluir cwd real, checkout Git, managed Preview root, evidencia de materialización, comando/acción exacta, proceso/respawn y estado HTTP observable.

AI Studio puede incluir una sección opcional `IMPLEMENTER_SUGGESTION` con una propuesta o pista diagnóstica sustentada en evidencia. Esa sugerencia no es una decisión formal ni autoriza código. El Supervisor decide si requiere un Work Item y coordina al Agente implementador, que sigue siendo la única autoridad de cambios persistentes de repositorio.

---


---

# 30. RESEARCH_GATE + STRATEGIC_RATIONALE

**Provenance:** Issue #35. Antes de la integración de PR #49, Issue #35 permanecía OPEN y esta regla existía como decisión humana operativamente vigente, todavía no integrada canónicamente. La regla quedó consolidada en el workflow canónico mediante Issue #47 / PR #49. Issue #35 permanece OPEN.

## 30.1 Cuándo se activa RESEARCH_GATE

Antes de proponer o implementar una decisión técnica o estratégica material cuya validez dependa de información externa susceptible de cambio, el agente debe activar `RESEARCH_GATE`.

Incluye, como mínimo, decisiones dependientes de:

- versiones de SDK, API o runtime;
- librerías, frameworks o herramientas;
- estrategia de despliegue;
- integración con proveedores o plataformas;
- autenticación o seguridad dependiente de servicios externos;
- formatos o protocolos externos;
- límites, cuotas, planes o condiciones vigentes;
- alternativas de arquitectura o ingeniería cuya conveniencia dependa del estado actual del ecosistema.

No se activa automáticamente para decisiones locales, mecánicas o completamente determinadas por la documentación y el código vigentes, por ejemplo nombres, formato, refactors triviales autorizados o implementación directa sin dependencia de información externa mutable.

## 30.2 Investigación y evidencia

Cuando el gate se activa, el agente debe:

1. identificar explícitamente el punto de decisión;
2. explicar qué dato externo actual necesita confirmar;
3. investigar fuentes vigentes, priorizando fuentes primarias/oficiales;
4. separar hechos del proyecto, hechos externos verificados, inferencias e incertidumbres;
5. registrar la propuesta y evidencia en el Issue del Work Item;
6. devolver control al Supervisor antes de aplicar una estrategia no determinada ya por el Work Item.

Fuentes prioritarias:

- documentación oficial del proveedor;
- especificaciones;
- release notes;
- repositorios oficiales;
- documentación técnica oficial.

Blogs, foros y comunidad pueden aportar contexto o descubrimiento, pero no deben ser la única base cuando existe una fuente primaria relevante.

La investigación produce evidencia y propuesta. **No equivale a decisión aprobada.**

## 30.3 Verificación del Supervisor

El Supervisor contrasta de forma independiente las afirmaciones estratégicas relevantes antes de autorizar su aplicación y las evalúa contra:

- Objective;
- Acceptance Criteria;
- Authorized Scope;
- arquitectura;
- especificaciones;
- workflow;
- estado actual del repositorio y SHA.

Si la conclusión exige cambiar intención de producto, ampliar scope, adoptar una integración no autorizada, introducir credenciales o costes, cambiar el workflow fuera del Work Item o tomar una decisión reservada al Humano, el Supervisor usa `ESCALATE` en vez de aplicarla unilateralmente.

## 30.4 STRATEGIC_RATIONALE

La justificación se persiste en el Issue del Work Item para decisiones estratégicas/materiales, no para actividad mecánica como “copié”, “leí” o “ejecuté”.

Plantilla mínima:

```text
STRATEGIC_RATIONALE

WORK ITEM: #<issue>

DECISION POINT:
<decisión técnica/estratégica material>

WHY CURRENT RESEARCH IS REQUIRED:
<qué información externa susceptible de cambio debe verificarse>

PROJECT CONSTRAINTS:
<workflow, arquitectura, specs, scope, SHA>

CURRENT EXTERNAL EVIDENCE:
- <fuente primaria, fecha/versión, hecho relevante>
- <fuente adicional si corresponde>

OPTIONS CONSIDERED:
A. ...
B. ...
C. ...

PROPOSED APPROACH:
...

RATIONALE:
<por qué encaja con este proyecto>

RISKS / UNCERTAINTIES:
...

SUPERVISOR VERIFICATION:
PENDING | VERIFIED

RATIONALE STATUS:
DRAFT | VERIFIED | SUPERSEDED
```

`Rationale Status` no crea estados formales nuevos. Los estados formales del Supervisor permanecen exactamente:

```text
SEMANTIC_ACCEPTED
REWORK
HOLD
ESCALATE
```

Si una decisión estratégica cambia, se conserva el razonamiento histórico y la decisión anterior se marca `SUPERSEDED` cuando corresponda; no se borra la evidencia previa.

## 30.5 Aplicación por rol y límites de autoridad

**Agente implementador**

- no inventa versiones, APIs o prácticas actuales;
- investiga antes de escoger una estrategia técnica material no determinada;
- registra propuesta y evidencia;
- no amplía scope;
- implementa sólo después de la autorización del Supervisor cuando la estrategia no esté ya determinada.

**AI_STUDIO_OPERATOR**

Cuando una recomendación dependa del estado actual de Google o de otra información externa mutable, separa observación directa, documentación actual, inferencia y desconocido; devuelve evidencia al Supervisor y no convierte su recomendación en decisión canónica.

**Supervisor**

- decide si el Research Gate está satisfecho;
- contrasta evidencia de forma independiente;
- decide únicamente dentro de la autoridad ya existente;
- usa `ESCALATE` cuando corresponda.

Este protocolo no concede nueva autoridad de escritura, merge, scope o decisión al Agente implementador ni a AI Studio.


---

# 31. TECHNICAL PERMISSION != WORKFLOW AUTHORITY

**Provenance:** Issue #39. Antes de la integración de PR #49, Issue #39 permanecía OPEN y esta regla existía como decisión humana operativamente vigente, todavía no integrada canónicamente. PR #40 fue cerrado sin merge y no constituye integración canónica. La regla quedó consolidada en el workflow canónico mediante Issue #47 / PR #49, sin reutilizar PR #40 como evidencia válida de implementación. Issue #39 permanece OPEN.

Regla:

```text
TECHNICAL PERMISSION != WORKFLOW AUTHORITY
AI_STUDIO_ALLOWED_REPOSITORY_WRITES = NONE
ALLOWED WRITE PATHS = NONE
```

Aunque una OAuth App, GitHub App, integración o herramienta disponga técnicamente de scopes de escritura, esos permisos técnicos **no conceden autoridad operacional** cuando el workflow no la autoriza.

AI Studio puede consumir/importar/pull desde GitHub y operar únicamente conforme al protocolo `AI_STUDIO_OPERATOR`. No puede usar capacidad técnica disponible para:

- Push Changes;
- Stage and commit;
- commit directo;
- crear o modificar branch;
- crear o modificar PR;
- editar workflows;
- escribir directamente en `main`;
- modificar archivos del repositorio;
- sincronizar cambios desde AI Studio hacia GitHub;
- realizar cualquier otro write de estado del repositorio.

La instalación de la GitHub App debe permanecer restringida a `cmiloarevalo-hash/G_INF_01` salvo decisión humana explícita para otro repositorio.

Una allowlist descrita únicamente en prompt o documentación **no constituye enforcement técnico suficiente** cuando la integración conserva permisos más amplios. No se debe afirmar que la prohibición está técnicamente garantizada sólo porque el prompt o la documentación la declaren.

## 31.1 Excepción futura de escritura

No existe excepción activa.

El namespace sugerido en Issue #39:

```text
docs/ai-studio-evidence/**
```

permanece:

```text
NOT AUTHORIZED
NOT ACTIVE
```

Cualquier excepción futura requiere, como mínimo:

1. decisión humana explícita;
2. Work Item separado;
3. alcance y allowlist explícitos;
4. prohibición de escritura directa a `main`;
5. control GitHub-side verificable antes de afirmar enforcement;
6. revisión de autoridad, seguridad y rollback;
7. actualización canónica del workflow antes de usarla como regla general.

Tener scopes técnicos amplios nunca activa implícitamente una excepción. GitHub continúa siendo la fuente persistente de verdad y el Supervisor conserva la decisión dentro de la autoridad vigente.

# 32. LOCAL_AGENT_OPERATOR — verificación y diagnóstico local no-write

**Fuente de la definición:** Work Item #5 de `cmiloarevalo-hash/Actuador`. Esta sección define autoridad operacional, no implementa runtime ni enforcement técnico en Actuador.

## 32.1 Rol y separación de autoridad

`LOCAL_AGENT_OPERATOR` es un operador técnico subordinado. Comparte con `AI_STUDIO_OPERATOR` la naturaleza de observación, prueba, diagnóstico y retorno de evidencia sin escritura del producto. Se distinguen por el entorno: AI Studio y recursos remotos autorizados (§29), frente a repositorio, terminal, navegador y recursos locales autorizados (§32). No se fusionan los roles, no se reinterpretan actuaciones anteriores ni se transfieren permisos entre ellos.

El Supervisor delimita Semantic Scope y Path Scope, autoriza la actuación y clasifica la evidencia como defecto de repositorio, problema de entorno o evidencia insuficiente. Conserva las decisiones `HOLD / REWORK / ESCALATE / SEMANTIC_ACCEPTED` conforme a las reglas existentes. El Implementador conserva la escritura autorizada por branch/commit/PR; ante un hallazgo del operador, sólo aplica la corrección después del REWORK autorizado y dentro de su alcance. El operador no se convierte implícitamente en Implementador aunque la misma herramienta pueda ejercer ambos roles en tareas distintas.

GitHub y Workflow son la fuente persistente de autoridad y evidencia. El Humano conserva intención, permisos y decisiones reservadas; esta sección no amplía la autoridad de ningún rol existente.

## 32.2 Capacidades y prohibiciones

Sólo dentro de una actuación explícitamente autorizada puede:

- leer repositorio, archivos y contexto local; reconstruir Issue, branch, HEAD, PR y decisiones;
- ejecutar comandos de lectura/diagnóstico, build, tests y aplicaciones o scripts existentes;
- usar recursos locales no versionados necesarios para la prueba y el navegador/perfil previamente preparado por el Humano;
- inspeccionar DOM, selectores, sesión y destino; ejecutar pruebas locales autorizadas;
- capturar y publicar evidencia técnica mediante el mecanismo limitado de §32.5;
- cruzar un efecto externo sólo con autorización explícita suficiente para ese efecto;
- diagnosticar, detenerse y devolver evidencia al Supervisor ante un posible defecto.

No puede, por razón de este rol:

- modificar código, producto o archivos versionados; aplicar fixes;
- crear/modificar commits o branches, hacer push o merge;
- abrir PRs ni modificar su contenido, metadatos o revisión; la única publicación permitida en un PR existente es el comentario de evidencia autorizado en §32.5;
- cambiar dependencias, schemas, prompts normativos o Workflow;
- cambiar secretos o credenciales;
- redefinir alcance, priorizar trabajo, levantar un HOLD o autoautorizar una actuación;
- aprobar semánticamente, emitir `SEMANTIC_ACCEPTED` o `MERGE_ELIGIBLE`, ni asumir autoridad del Implementador.

El uso de recursos no versionados no es una excepción para corregir el producto: sólo admite preparación local expresamente delimitada, salidas de build/tests, logs y configuración de prueba autorizada, sin alterar dependencias declaradas ni archivos versionados. Si la prueba exige un cambio prohibido, STOP y evidencia al Supervisor.

```text
TECHNICAL PERMISSION != WORKFLOW AUTHORITY
no autorización demostrable -> no efecto externo
```

Acceso a terminal, permisos de escritura, una sesión autenticada o credenciales disponibles no autorizan acciones. Una restricción documental no demuestra enforcement técnico. Las prohibiciones de AI Studio en §31 y su ausencia de excepción de escritura permanecen intactas.

## 32.3 Autorización, contexto y frontera humana

Antes de ejecutar, reconstruye desde GitHub el Issue, branch/HEAD/PR y la decisión vigente aplicable a ese SHA; lee Workflow y las fuentes pertinentes. No usa el recuerdo de un chat como autoridad. La solicitud del Supervisor debe quedar asociada al Work Item y contener como mínimo:

```text
LOCAL_AGENT_REQUEST
WORK ITEM: #<issue>
AUTHORIZATION: <referencia persistente del Supervisor y, cuando corresponda, del Humano>
EXPECTED SHA: <sha>
TASK: <una actuación concreta>
SEMANTIC SCOPE: <comportamiento/prueba autorizados>
PATH SCOPE: <rutas de lectura y recursos locales no versionados permitidos>
LOCAL TARGET: <aplicación/destino y perfil preparado, sin secretos>
EXTERNAL EFFECT: NONE | <efecto, destino, límite de intentos y autorización explícita>
PRECONDITIONS / STOP CONDITIONS: <condiciones observables>
EVIDENCE: <comprobaciones y destino autorizado de publicación>
```

Confirma checkout, HEAD exacto y estado del worktree antes de actuar. Un SHA distinto, cambios previos no cubiertos, autorización ausente/ambigua o precondición incumplida implica STOP y reporte `BLOCKED`. El Path Scope no concede escritura del producto. La autorización de una prueba no autoriza por inferencia Send, publicación, despliegue u otro efecto externo.

Se requiere intervención humana para autenticación manual, credenciales, desbloqueo de permisos y preparación de perfiles locales; el operador no introduce ni cambia credenciales. Para un efecto irreversible o materialmente observable sin autorización previa suficiente, se detiene y solicita intervención por el Supervisor. Las decisiones de producto o ingeniería se devuelven al Supervisor; éste decide dentro de su autoridad y escala al Humano las decisiones reservadas, cambios de alcance o excepciones. El operador no resuelve esas decisiones.

## 32.4 Ejecución y hallazgos

```text
AUTHORIZED_TEST
→ LOCAL_AGENT_OPERATOR ejecuta dentro del alcance
→ EVIDENCE (PASS / FAIL / BLOCKED)
→ clasificación del Supervisor
→ decisión vigente: HOLD / REWORK / ESCALATE / SEMANTIC_ACCEPTED, según corresponda
```

`AUTHORIZED_TEST` describe una precondición, no un nuevo estado formal. `PASS` es evidencia técnica, no aprobación. Antes de un efecto externo, comprueba autorización demostrable, destino, precondiciones y límites de intentos. Si no puede demostrar autorización suficiente, no produce el efecto. La incertidumbre posterior obliga a detenerse y reportar; no autoriza repetir el efecto ni ampliar la actuación. Realiza el cierre/limpieza local autorizado y registra cualquier fallo sin improvisar reparaciones.

```text
Posible defecto → STOP → evidencia → Supervisor
→ REWORK, si corresponde → Implementador
```

No aplica un fix para terminar la prueba. La clasificación del operador es provisional; el Supervisor decide si existe defecto de repositorio, problema de entorno o evidencia insuficiente y si se requiere intervención humana. Un bloqueo no se levanta por iniciativa del operador.

## 32.5 Evidencia y handoff

Retorna evidencia mínima verificable, sin secretos, cookies, credenciales ni contenido sensible. Cuando el Supervisor autorice explícitamente su publicación, puede añadir únicamente un comentario de evidencia al Issue o PR existente indicado, asociado al Work Item y SHA; no abre PRs, edita archivos ni altera decisiones, estados, labels o revisiones. Si no existe ese permiso, devuelve el reporte al Supervisor para su persistencia; no se autoautoriza a publicarlo.

```text
LOCAL_AGENT_REPORT
WORK ITEM: #<issue>
AUTHORIZATION: <referencia>
EXPECTED SHA: <sha>
OBSERVED SHA: <sha>
WORKTREE: <estado antes/después>
TASK / LOCAL TARGET: <actuación y destino, sin secretos>
RESULT: PASS | FAIL | BLOCKED
CLASSIFICATION: REPOSITORY | LOCAL_ENVIRONMENT | EXTERNAL_SERVICE | UNKNOWN (provisional)
EVIDENCE: <comandos/acciones, resultados y límites de lo observado>
EXTERNAL EFFECT: <autorización, intentos observados, resultado o incertidumbre; NONE si no hubo>
CONTROLLED CLOSE / CLEANUP: <resultado>
VERSIONED FILES MODIFIED: NO | <anomalía que obliga a STOP>
LOCAL RESOURCES: <cambios locales autorizados, sin datos sensibles>
ERROR / BLOCKER: none | <detalle>
```

El control vuelve al Supervisor. La evidencia se hace persistente mediante el Issue/PR autorizado; no sustituye su revisión por SHA ni concede aprobación, merge o autoridad futura.

# Resultado

Este workflow elimina completamente:

```text
GoFlow
.workflow/index.json
.workflow/project.json
wf status
wf begin
wf context
wf scope
wf verify
wf ci
wf review
```

y conserva la parte esencial del sistema:

```text
Humano
     ↓
Chat Web GPT
     ↓
GitHub Issue
     ↓
Agente implementador
     ↓
Branch + code + tests + PR
     ↓
GitHub
     ↓
Chat Web GPT
     ↓
SEMANTIC_ACCEPTED / REWORK / HOLD / ESCALATE
```

Es menos robusto mecánicamente que el workflow completo porque **scope, selección de contexto y verificación ya no están reforzados por software determinista**. Pero para probar colaboración **Chat Web GPT + Agente implementador + AI_STUDIO_OPERATOR + LOCAL_AGENT_OPERATOR + GitHub**, mantiene las partes más importantes sin introducir infraestructura adicional.


---

# Apéndice A — Provenance de mejoras consolidadas

| Fuente | Estado antes de la consolidación de #47 | Evidencia de integración / estado actual | Tratamiento en este documento |
|---|---|---|---|
| Issue #4 / PR #5 | CANONICAL | PR #5 merged; merge `7ceb98e7cff1621f21b3d9b5929acc7a264af739` | PRESERVED en §24 |
| Issue #26 / PR #27 | CANONICAL | PR #27 merged; merge `3fa731a13fd2a77531392fd5b22fd240c9091ba6` | PRESERVED en §22 |
| Issue #32 / PR #33 | CANONICAL | PR #33 merged; merge `d2325a23232e72599ffecc96a354c41490b5f527` | PRESERVED en §29 |
| Issue #36 / PR #38 | CANONICAL | PR #38 merged; merge `1a4167c1e29b46efaf09662b8fb11919bfac44cf` | PRESERVED en §29 + `AI_STUDIO_OPERATOR.md` |
| Issue #35 | OPERATIONAL_PENDING | Regla integrada canónicamente por Issue #47 / PR #49; Issue permanece OPEN | NEW §30, consolidado canónicamente por PR #49 |
| Issue #39 | OPERATIONAL_PENDING | Regla integrada canónicamente por Issue #47 / PR #49; Issue permanece OPEN; PR #40 siguió closed/not merged | NEW §31, consolidado canónicamente por PR #49 |
| PR #40 | SUPERSEDED as implementation evidence | Persisted #39 handoff invalidates reuse after role-separation violation | Excluded as canonical integration evidence |
| PR #49 | PROPOSED antes del merge | MERGED; merge `866d7aaa793cb9d1a2675965f911c6ddb37275e9` | Vehículo de integración canónica de Issue #47 |


---

# Apéndice B — Handover canónico

Desde la integración de PR #49 en `main@866d7aaa793cb9d1a2675965f911c6ddb37275e9`, la fuente normativa vigente es:

`WORKFLOW_CANONICO_SUPERVISOR_GITHUB_IMPLEMENTADOR_AI_STUDIO.md` en `main`.

El handover canónico quedó aplicado así:

- `WORKFLOW_CANONICO_SUPERVISOR_GITHUB_IMPLEMENTADOR_AI_STUDIO.md` es la fuente canónica activa del workflow;
- `WORKFLOW_SIMPLIFICADO_CHAT_WEB_GPT_GEMINI_3_8.md` queda retenido únicamente para trazabilidad histórica y contiene una referencia explícita al nuevo archivo;
- no deben tratarse ambos archivos como workflows canónicos simultáneamente;
- el merge de #47 no cierra automáticamente Issues #35 o #39; su cierre requiere evidencia y decisión conforme a su estado real.

La autoridad canónica descrita aquí proviene del estado integrado en `main`, no de la antigua branch o PR de trabajo.


---

# Apéndice C — Matriz completa de trazabilidad del baseline

Criterios:

- `PRESERVED`: contenido operativo del baseline se conserva semánticamente.
- `MOVED`: contenido trasladado sin pérdida semántica.
- `EXPANDED`: contenido existente conservado y ampliado por una regla ya autorizada.
- `NEW`: contenido sin sección equivalente en el baseline, sustentado por evidencia autorizada.
- `REMOVED`: eliminación propuesta; requiere justificación y autorización expresa.

Para las 49 secciones/subsecciones estructurales del baseline, `PRESERVED` es el resultado. No se propone `MOVED`, `EXPANDED` ni `REMOVED` sobre contenido del baseline; las reglas operativas validadas se incorporan como secciones nuevas para evitar reescritura silenciosa del material vigente.

| Sección/subsección del baseline | Clasificación | Ubicación nueva | Nota |
|---|---|---|---|
| 1. Objetivo | PRESERVED | 1. Objetivo | Contenido operativo del baseline conservado; sin cambio silencioso de autoridad o lifecycle. |
| 2. Principio fundamental | PRESERVED | 2. Principio fundamental | Contenido operativo del baseline conservado; sin cambio silencioso de autoridad o lifecycle. |
| 3. Responsabilidades | PRESERVED | 3. Responsabilidades | Contenido operativo del baseline conservado; sin cambio silencioso de autoridad o lifecycle. |
| 3.1 Chat Web GPT | PRESERVED | 3.1 Chat Web GPT | Contenido operativo del baseline conservado; sin cambio silencioso de autoridad o lifecycle. |
| 4. Agente implementador | PRESERVED | 4. Agente implementador | Contenido operativo del baseline conservado; sin cambio silencioso de autoridad o lifecycle. |
| 5. GitHub | PRESERVED | 5. GitHub | Contenido operativo del baseline conservado; sin cambio silencioso de autoridad o lifecycle. |
| 6. Documentación del proyecto | PRESERVED | 6. Documentación del proyecto | Contenido operativo del baseline conservado; sin cambio silencioso de autoridad o lifecycle. |
| 7. Unidad de trabajo: GitHub Issue | PRESERVED | 7. Unidad de trabajo: GitHub Issue | Contenido operativo del baseline conservado; sin cambio silencioso de autoridad o lifecycle. |
| 8. Dos tipos de scope | PRESERVED | 8. Dos tipos de scope | Contenido operativo del baseline conservado; sin cambio silencioso de autoridad o lifecycle. |
| Semantic Scope | PRESERVED | Semantic Scope | Contenido operativo del baseline conservado; sin cambio silencioso de autoridad o lifecycle. |
| Path Scope | PRESERVED | Path Scope | Contenido operativo del baseline conservado; sin cambio silencioso de autoridad o lifecycle. |
| 9. Flujo completo | PRESERVED | 9. Flujo completo | Contenido operativo del baseline conservado; sin cambio silencioso de autoridad o lifecycle. |
| Fase A — intención | PRESERVED | Fase A — intención | Contenido operativo del baseline conservado; sin cambio silencioso de autoridad o lifecycle. |
| Fase B — creación del Work Item | PRESERVED | Fase B — creación del Work Item | Contenido operativo del baseline conservado; sin cambio silencioso de autoridad o lifecycle. |
| 10. Inicio del Agente implementador | PRESERVED | 10. Inicio del Agente implementador | Contenido operativo del baseline conservado; sin cambio silencioso de autoridad o lifecycle. |
| 11. Bootstrap del Agente implementador | PRESERVED | 11. Bootstrap del Agente implementador | Contenido operativo del baseline conservado; sin cambio silencioso de autoridad o lifecycle. |
| 12. Política de lectura | PRESERVED | 12. Política de lectura | Contenido operativo del baseline conservado; sin cambio silencioso de autoridad o lifecycle. |
| 13. Implementación | PRESERVED | 13. Implementación | Contenido operativo del baseline conservado; sin cambio silencioso de autoridad o lifecycle. |
| 14. Problemas descubiertos durante el trabajo | PRESERVED | 14. Problemas descubiertos durante el trabajo | Contenido operativo del baseline conservado; sin cambio silencioso de autoridad o lifecycle. |
| 15. Verificación local | PRESERVED | 15. Verificación local | Contenido operativo del baseline conservado; sin cambio silencioso de autoridad o lifecycle. |
| 16. Publicación | PRESERVED | 16. Publicación | Contenido operativo del baseline conservado; sin cambio silencioso de autoridad o lifecycle. |
| 17. Handoff del Agente implementador | PRESERVED | 17. Handoff del Agente implementador | Contenido operativo del baseline conservado; sin cambio silencioso de autoridad o lifecycle. |
| 18. Revisión de Chat Web GPT | PRESERVED | 18. Revisión de Chat Web GPT | Contenido operativo del baseline conservado; sin cambio silencioso de autoridad o lifecycle. |
| 19. Significado de las decisiones | PRESERVED | 19. Significado de las decisiones | Contenido operativo del baseline conservado; sin cambio silencioso de autoridad o lifecycle. |
| SEMANTIC_ACCEPTED | PRESERVED | SEMANTIC_ACCEPTED | Contenido operativo del baseline conservado; sin cambio silencioso de autoridad o lifecycle. |
| REWORK | PRESERVED | REWORK | Contenido operativo del baseline conservado; sin cambio silencioso de autoridad o lifecycle. |
| HOLD | PRESERVED | HOLD | Contenido operativo del baseline conservado; sin cambio silencioso de autoridad o lifecycle. |
| ESCALATE | PRESERVED | ESCALATE | Contenido operativo del baseline conservado; sin cambio silencioso de autoridad o lifecycle. |
| 20. REWORK | PRESERVED | 20. REWORK | Contenido operativo del baseline conservado; sin cambio silencioso de autoridad o lifecycle. |
| 21. Decisión vigente | PRESERVED | 21. Decisión vigente | Contenido operativo del baseline conservado; sin cambio silencioso de autoridad o lifecycle. |
| 22. CI | PRESERVED | 22. CI | Contenido operativo del baseline conservado; sin cambio silencioso de autoridad o lifecycle. |
| 23. Integración | PRESERVED | 23. Integración | Contenido operativo del baseline conservado; sin cambio silencioso de autoridad o lifecycle. |
| 24. Merge | PRESERVED | 24. Merge | Contenido operativo del baseline conservado; sin cambio silencioso de autoridad o lifecycle. |
| 25. Cambio de sesión del Agente implementador | PRESERVED | 25. Cambio de sesión del Agente implementador | Contenido operativo del baseline conservado; sin cambio silencioso de autoridad o lifecycle. |
| 26. Cambio de sesión de Chat Web GPT | PRESERVED | 26. Cambio de sesión de Chat Web GPT | Contenido operativo del baseline conservado; sin cambio silencioso de autoridad o lifecycle. |
| 27. Rol del humano | PRESERVED | 27. Rol del humano | Contenido operativo del baseline conservado; sin cambio silencioso de autoridad o lifecycle. |
| 28. Reglas esenciales | PRESERVED | 28. Reglas esenciales | Contenido operativo del baseline conservado; sin cambio silencioso de autoridad o lifecycle. |
| 29. AI_STUDIO_OPERATOR — protocolo subordinado de operación externa | PRESERVED | 29. AI_STUDIO_OPERATOR — protocolo subordinado de operación externa | Contenido operativo del baseline conservado; sin cambio silencioso de autoridad o lifecycle. |
| 29.1 Permission Matrix | PRESERVED | 29.1 Permission Matrix | Contenido operativo del baseline conservado; sin cambio silencioso de autoridad o lifecycle. |
| 29.2 Inicio: AI_STUDIO_REQUEST | PRESERVED | 29.2 Inicio: AI_STUDIO_REQUEST | Contenido operativo del baseline conservado; sin cambio silencioso de autoridad o lifecycle. |
| 29.3 Modos y disciplina de prompts | PRESERVED | 29.3 Modos y disciplina de prompts | Contenido operativo del baseline conservado; sin cambio silencioso de autoridad o lifecycle. |
| 29.4 SHA Gate | PRESERVED | 29.4 SHA Gate | Contenido operativo del baseline conservado; sin cambio silencioso de autoridad o lifecycle. |
| 29.5 Ventanas de intervención | PRESERVED | 29.5 Ventanas de intervención | Contenido operativo del baseline conservado; sin cambio silencioso de autoridad o lifecycle. |
| 29.6 Clasificación y diagnóstico | PRESERVED | 29.6 Clasificación y diagnóstico | Contenido operativo del baseline conservado; sin cambio silencioso de autoridad o lifecycle. |
| 29.7 Protocolo PUBLISH | PRESERVED | 29.7 Protocolo PUBLISH | Contenido operativo del baseline conservado; sin cambio silencioso de autoridad o lifecycle. |
| 29.8 SPIKE_READ_ONLY para integraciones Google | PRESERVED | 29.8 SPIKE_READ_ONLY para integraciones Google | Contenido operativo del baseline conservado; sin cambio silencioso de autoridad o lifecycle. |
| 29.9 Regla absoluta de no escritura | PRESERVED | 29.9 Regla absoluta de no escritura | Contenido operativo del baseline conservado; sin cambio silencioso de autoridad o lifecycle. |
| 29.10 Fin: AI_STUDIO_REPORT y evidencia | PRESERVED | 29.10 Fin: AI_STUDIO_REPORT y evidencia | Contenido operativo del baseline conservado; sin cambio silencioso de autoridad o lifecycle. |
| Resultado | PRESERVED | Resultado | Contenido operativo del baseline conservado; sin cambio silencioso de autoridad o lifecycle. |
| Issue #35 — RESEARCH_GATE + STRATEGIC_RATIONALE | NEW | §30 | Regla operativa humana validada; OPEN antes de PR #49; integrada canónicamente vía Issue #47 / PR #49; Issue permanece OPEN. |
| Issue #39 — TECHNICAL PERMISSION != WORKFLOW AUTHORITY | NEW | §31 | Regla operativa humana validada; OPEN antes de PR #49; integrada canónicamente vía Issue #47 / PR #49; PR #40 no se usa como integración canónica; Issue permanece OPEN. |
| Provenance histórica validada | NEW | Apéndice A | Metadato de trazabilidad; no crea autoridad nueva. |
| Handover old → new | NEW | Apéndice B | Mecánica de reemplazo ejecutada mediante el merge de PR #49; evita dos fuentes aparentemente canónicas. |

Resumen:

- baseline estructural: **49/49 representado**;
- `PRESERVED`: 49;
- `MOVED`: 0;
- `EXPANDED`: 0;
- `REMOVED`: 0;
- reglas operativas nuevas respecto del baseline: 2, ambas respaldadas por decisiones humanas persistidas (#35 y #39);
- recomendaciones no adoptadas importadas: 0.
