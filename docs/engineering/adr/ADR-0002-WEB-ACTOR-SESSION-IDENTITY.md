# ADR-0002 — Identidad de actores Web y binding de sesión output-blind

## Estado

Propuesto para revisión del Supervisor en Work Item #41.

## Contexto

Actuador entrega handoffs mecánicamente a dos actores Web configurados:

```text
SUPERVISOR_WEB
IMPLEMENTER_WEB
```

La autoridad no nace del navegador. El Workflow canónico y GitHub siguen siendo la fuente persistente de autoridad, alcance, revisión y evidencia. ADR-0001 establece además que el estado local de Actuador es subordinado, descartable y no puede completar autoridad faltante.

Las decisiones aceptadas en #27 y #28 fijan dos límites previos:

- el transporte Web del prototipo usa Playwright/DOM mediante interfaces soportadas, sin una capa privada de WebSocket ni CDP/remote debugging;
- Actuador no consume Output o transcript del chatbot y limita su observación Web a una superficie mecánica acotada.

#38 y #39 identifican como problema pendiente la identidad determinista de actor, contexto, página/chat/sesión y rotación cuando pueden coexistir dos actores Web.

#40 investigó ese problema. R1–R10 fueron validados por el Supervisor mediante SRV1–SRV4 y el corpus quedó `SEMANTIC_ACCEPTED` como evidencia para decisiones posteriores. Esa aceptación no adoptó por sí sola una arquitectura ni demostró comportamiento específico de ChatGPT Web.

Este ADR persiste únicamente la frontera arquitectónica autorizada por #41.

## Decisión

### 1. Separación explícita de identidades y autoridad

Actuador debe distinguir explícitamente:

```text
Workflow/GitHub authority
actor role identity
browser context/profile identity
page/chat/session binding
local operational state
```

Ninguna de estas categorías se infiere silenciosamente desde otra.

En particular:

- GitHub/Workflow decide autoridad y alcance;
- el rol Web es una identidad configurada cerrada;
- el contexto/perfil del navegador es un recurso técnico local asociado a ese rol;
- una Page/tab/chat/session es un binding mecánico dentro del contexto ya asociado al rol;
- el estado local sólo registra información operacional descartable.

### 2. Actores Web distintos y configurados

`SUPERVISOR_WEB` e `IMPLEMENTER_WEB` son actores Web distintos.

La identidad del actor se establece mediante configuración local explícita que vincula el rol con su entorno de navegador autorizado —incluido el contexto/perfil que corresponda al diseño operativo aprobado— y con su contrato mecánico de destino.

La identidad del actor **no** se deriva de:

- texto del transcript;
- Output del modelo;
- contenido semántico de la conversación;
- título o posición de una pestaña por sí solos;
- orden de ventanas;
- estado local no validado;
- inferencias desde una sesión anterior.

La topología concreta de cuentas y perfiles no se fija en este ADR.

### 3. Binding mecánico de Page/chat/session

Una Page/tab/session sólo puede considerarse elegible después de ser vinculada mecánicamente dentro del contexto de navegador que ya está asociado al rol.

El binding debe usar únicamente primitivas documentadas y soportadas de Playwright y evidencia causal/mecánica compatible con el límite output-blind.

Pueden formar parte del contrato futuro, cuando estén verificadas y autorizadas:

- relación entre BrowserContext y Page;
- eventos documentados de Page/popup;
- URL/prefijo esperado;
- controles o markers no pertenecientes al transcript;
- estado local opaco que relacione el binding vigente con el rol configurado.

La posición de una pestaña o ventana no constituye identidad. Tampoco la constituye el contenido de la conversación.

El detalle exacto de cómo se crea o selecciona una nueva Page en ChatGPT Web queda diferido a prueba local.

### 4. Una única sesión elegible por rol

Para cada rol puede existir como máximo un binding de Page/chat/session marcado como ACTIVE y elegible para entrega.

```text
0 candidates
→ STOP

1 validated ACTIVE candidate
→ eligible for later authorized delivery

>1 candidates or ambiguous evidence
→ STOP
```

Actuador no elige por heurística entre candidatos ambiguos, no adivina el destino y no rerutea automáticamente.

### 5. Rotación sin transferencia de autoridad ni replay

La rotación o sustitución de una sesión es una operación técnica de binding.

No puede:

- crear autoridad Workflow;
- transferir autoridad desde la sesión anterior;
- renovar una autorización;
- convertir estado local en autoridad;
- habilitar el replay de una solicitud ya intentada;
- habilitar el retry de una entrega `UNCERTAIN_AFTER_SEND`.

Una sesión reemplazada deja de ser elegible. La sesión nueva debe reconstruir su contexto autorizado desde GitHub/Workflow y superar de nuevo los gates mecánicos aplicables.

### 6. Estado local operacional y descartable

El estado de sesión/binding local puede conservar únicamente información técnica necesaria para detectar, por ejemplo:

- rol configurado;
- binding de contexto/perfil;
- binding actual de Page/session;
- vigencia o estado de reemplazo;
- referencia/hash de request o prompt cuando corresponda;
- estado técnico suficiente para impedir replay después de un intento o incertidumbre.

Ese estado:

- no es fuente de verdad;
- no crea actor, autorización, aprobación, REWORK, prioridad, scope o merge;
- no contiene ni replica cookies, secretos o credenciales;
- puede invalidarse y reconstruirse;
- debe fallar cerrado si está ausente, ambiguo, contradictorio o obsoleto.

### 7. Superficie Web output-blind

La observación Web del runtime permanece restringida al contrato aceptado en #28:

- URL configurada;
- marker mecánico configurado de rol/sesión/destino;
- prompt input;
- exacto readback del input insertado por Actuador;
- control Send configurado;
- estado post-Send estrechamente acotado del mismo prompt input.

Actuador no lee, extrae, parsea, clasifica, copia, persiste ni utiliza:

- Output del modelo;
- transcript;
- contenido de respuestas;
- red/WebSocket de respuesta;
- hidden application state para extraer Output;
- browser internals;
- CDP/remote debugging;
- protocolos privados/reverse-engineered del sitio.

### 8. APIs soportadas y fail-closed

La implementación futura debe usar sólo APIs públicas/documentadas de Playwright compatibles con la versión autorizada del proyecto.

Quedan fuera de esta arquitectura:

- CDP/remote debugging como mecanismo de identidad o entrega;
- WebSocket privado del sitio;
- reverse engineering de protocolos o estado interno;
- mecanismos que dependan de Output/transcript;
- mecanismos que eludan protecciones, controles o límites del servicio.

Si una señal requerida no puede demostrarse de manera determinista:

```text
STOP
→ no Send
→ no reroute
→ no guess
```

### 9. Gate de uso Web real

Este ADR no autoriza uso Web real ni Send.

Antes de cualquier operación real deben cumplirse, además de los gates de Workflow:

- la autoridad específica del Supervisor/Humano que corresponda;
- el contexto de cuenta/perfil decidido por el Humano;
- la evaluación aplicable de términos/políticas vigente;
- la prueba local necesaria de las señales mecánicas concretas.

La investigación #40 concluyó que la aplicabilidad exacta de los términos/acuerdo a la automatización mecánica prevista requiere interpretación Humana/Supervisor; este ADR preserva esa condición.

## Alternativas consideradas

### A. Inferir actor/chat desde conversación, transcript u Output

**Rechazada.**

Viola el límite output-blind de #28 y confunde contenido Web con identidad/autoridad.

### B. Usar orden de pestañas, título o UI transitoria como identidad suficiente

**Rechazada como evidencia suficiente.**

Puede ser información operacional auxiliar, pero no establece por sí sola una identidad determinista ni autoridad.

### C. Rol configurado + contexto/perfil asociado + binding mecánico/causal de Page/session

**Seleccionada como frontera arquitectónica.**

Separa el rol del recurso técnico y permite fail-closed sin consumir Output. Este ADR selecciona la frontera, no una mecánica ChatGPT-Web concreta.

### D. CDP, remote debugging o WebSocket privado/reverse-engineered

**Rechazada.**

Está fuera de la dirección aceptada en #27/#28 y fuera del alcance autorizado.

### E. Mecánica exacta de creación de New chat/Page

**Diferida.**

No se decide aquí entre gestos de UI, `context.newPage()` + navegación u otra técnica soportada. La alternativa concreta requiere evidencia local y autorización posterior.

### F. Topología exacta de cuenta/perfil para ambos roles

**Diferida a decisión Humana/Supervisor.**

El requisito arquitectónico es separación/binding explícito y no ambiguo; este ADR no decide propiedad de cuentas, credenciales ni cuántos perfiles persistentes concretos se usarán.

## Consecuencias

### Positivas

- mantiene GitHub/Workflow como única frontera de autoridad;
- impide usar contenido del chat como identidad;
- permite razonar sobre dos actores Web simultáneos sin depender del orden de ventanas;
- hace la ambigüedad observable un motivo de STOP;
- conserva la semántica one-Send/no-retry;
- permite que la mayor parte del protocolo de estado y fallos pueda probarse con drivers falsos/CI;
- deja el comportamiento específico de ChatGPT Web fuera de la arquitectura hasta que exista evidencia local.

### Costes y límites

- la implementación futura necesitará estado técnico local para binding, vigencia y recuperación;
- reinicios y rotación exigirán revalidación mecánica antes de considerar una sesión elegible;
- los selectores y markers concretos de la UI pueden requerir mantenimiento y prueba local;
- la arquitectura no elimina la necesidad de una decisión Humana sobre cuenta/perfil y aplicabilidad de términos;
- una integración futura debe mantenerse compatible con la versión de Playwright autorizada o tramitar cualquier cambio de dependencia por un Work Item separado.

## Constraints / reglas fail-closed

Antes de usar un binding Web futuro deben cumplirse como mínimo:

1. el rol configurado es exactamente uno de `SUPERVISOR_WEB` o `IMPLEMENTER_WEB`;
2. la autoridad proviene de GitHub/Workflow, no del binding local;
3. el contexto/perfil corresponde al rol configurado según la configuración autorizada;
4. existe exactamente una Page/session elegible y mecánicamente validada para ese rol;
5. URL y cualquier marker mecánico requerido coinciden con el contrato configurado;
6. no se usa Output/transcript como señal;
7. el request no fue ya intentado ni quedó incierto;
8. cualquier estado local usado es vigente y no contradictorio;
9. cualquier duda, ausencia o multiplicidad de señales produce STOP.

Una rotación no puede relajar estos gates.

## Deferred / LOCAL_PROOF_REQUIRED

No quedan decididos ni demostrados por este ADR:

- selectores DOM concretos de ChatGPT Web;
- marker no-transcript concreto para distinguir destino/sesión;
- si `ControlOrMeta+click` sobre New chat abre de forma fiable una nueva Page/popup;
- si es preferible `context.newPage()` + navegación u otra mecánica soportada;
- transición exacta y estable del own-input después de Send;
- comportamiento real de locking/concurrencia/reinicio de los perfiles en el entorno objetivo;
- topología exacta de cuenta/perfil para `SUPERVISOR_WEB` e `IMPLEMENTER_WEB`;
- modelo/schema concreto del estado local de binding y recuperación;
- disposición Humana/Supervisor sobre aplicabilidad de términos/políticas al uso Web real.

Ninguno de estos elementos puede convertirse en FACT o gate de producción sólo por estar mencionado aquí.

## Fuentes / trazabilidad

Fuentes del proyecto utilizadas por este ADR:

- Work Item #41 — alcance y decisiones que este ADR debe persistir:  
  https://github.com/cmiloarevalo-hash/Actuador/issues/41
- Workflow canónico en `main@047d84cdf50229c83bf054cddd33601c3ec328f2` — autoridad, revisión, CI, Research Gate y límites de rol:  
  https://github.com/cmiloarevalo-hash/Actuador/blob/047d84cdf50229c83bf054cddd33601c3ec328f2/WORKFLOW_CANONICO_SUPERVISOR_GITHUB_IMPLEMENTADOR_AI_STUDIO.md
- ADR-0001 — Workflow como frontera de autoridad del Actuador:  
  https://github.com/cmiloarevalo-hash/Actuador/blob/047d84cdf50229c83bf054cddd33601c3ec328f2/docs/engineering/adr/ADR-0001-WORKFLOW-BOUNDARY.md
- #27 — dirección de transporte Playwright/DOM y rechazo de mecanismos privados/no necesarios:  
  https://github.com/cmiloarevalo-hash/Actuador/issues/27
- #28 — protocolo Web output-blind aceptado, comentario de Supervisor `5853246335`:  
  https://github.com/cmiloarevalo-hash/Actuador/issues/28#issuecomment-5853246335
- #38 — design gate de identidad/rotación de actores Web:  
  https://github.com/cmiloarevalo-hash/Actuador/issues/38
- #39 — activity thread de identidad/rotación y límites de ejecución:  
  https://github.com/cmiloarevalo-hash/Actuador/issues/39
- #40 R10 — síntesis trazable del corpus de investigación, comentario `5858093653`:  
  https://github.com/cmiloarevalo-hash/Actuador/issues/40#issuecomment-5858093653
- #40 SRV1 — evidencia/integridad, comentario `5858122166`:  
  https://github.com/cmiloarevalo-hash/Actuador/issues/40#issuecomment-5858122166
- #40 SRV2 — aplicabilidad técnica, comentario `5858124191`:  
  https://github.com/cmiloarevalo-hash/Actuador/issues/40#issuecomment-5858124191
- #40 SRV3 — relevancia de producto/arquitectura, comentario `5858127016`:  
  https://github.com/cmiloarevalo-hash/Actuador/issues/40#issuecomment-5858127016
- #40 SRV4 — `SEMANTIC_ACCEPTED` del corpus como input de decisión, comentario `5858129907`:  
  https://github.com/cmiloarevalo-hash/Actuador/issues/40#issuecomment-5858129907

No se incorporan hechos externos nuevos en este ADR. Los hechos externos necesarios para el razonamiento están trazados y validados en #40; los comportamientos ChatGPT-Web aún no demostrados permanecen `LOCAL_PROOF_REQUIRED`.

## Alcance de esta decisión

Este ADR define la frontera arquitectónica para identidad y binding de sesión de los actores Web.

No implementa runtime, no autoriza navegador real, no autoriza Send y no fija los detalles ChatGPT-Web que requieren prueba local.

Cualquier implementación posterior requiere un Work Item separado y revisión del Supervisor.
