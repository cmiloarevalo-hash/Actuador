# Technical Specification

## 1. Propósito

Definir las decisiones técnicas generales conocidas actualmente.

No intenta especificar toda la implementación.

## 2. Plataforma inicial

La primera versión se ejecutará localmente.

Orientación inicial:

- Node.js;
- TypeScript;
- Playwright;
- navegador Chromium compatible;
- ejecución local;
- script `START.bat`;
- GitHub para repositorio, build, pruebas y evidencia.

Los detalles de versiones, librerías auxiliares y estructura final serán definidos durante la implementación.

## 3. Estructura inicial prevista

Para la primera etapa:

```text
actuador/
├── src/
│   ├── main.ts
│   └── playwright-driver.ts
├── config/
│   └── actuator.config.json
├── tests/
├── scripts/
│   └── START.bat
├── package.json
├── package-lock.json
├── tsconfig.json
├── .gitignore
└── README.md
```

La estructura debe mantenerse pequeña.

## 4. Configuración inicial

La configuración deberá permitir al menos:

- identificar el destino web de prueba;
- indicar el perfil local del navegador;
- identificar la conversación o destino configurado;
- indicar el prompt de prueba;
- configurar ubicación de logs.

No se almacenarán secretos en configuración versionada.

## 5. Playwright

La primera implementación deberá exponer funciones equivalentes a:

```text
openActor()
checkSession()
focusConversation()
locatePromptInput()
insertPrompt()
verifyPrompt()
sendPrompt()
```

### Reglas

- un solo mecanismo de envío por prompt;
- no ejecutar `Enter` y `click Send` simultáneamente;
- no repetir un envío incierto;
- no navegar a destinos no configurados;
- no subir ni descargar archivos en la primera etapa;
- no cambiar configuración de cuenta;
- no manipular credenciales;
- no ejecutar instrucciones Playwright generadas libremente por una API.

## 6. Perfil de navegador

Se utilizará un perfil dedicado a Actuador.

El login inicial puede ser manual.

El perfil debe:

- mantenerse fuera del repositorio o ignorado;
- no incluirse en artifacts;
- no aparecer en logs;
- no mezclarse con el perfil habitual del usuario.

## 7. Localización de elementos

La estrategia inicial debe preferir selectores resistentes:

```text
role
↓
label
↓
placeholder
↓
contrato estable
↓
selector específico
```

Los detalles exactos se resolverán durante la implementación.

## 8. Estados técnicos mínimos de M1

```text
SUCCESS
FAILED_BEFORE_SEND
UNCERTAIN_AFTER_SEND
```

`FAILED_BEFORE_SEND` puede incluir un código de causa, por ejemplo:

```text
SESSION_INVALID
WRONG_DESTINATION
INPUT_NOT_FOUND
PROMPT_MISMATCH
PAGE_NOT_READY
PROFILE_LOCKED
```

Estos códigos no representan estados de Workflow.

## 9. Caché de contexto de Workflow

En etapas posteriores podrá existir almacenamiento local mínimo para:

- referencias de Workflow necesarias;
- última actuación conocida;
- referencias de contexto;
- estado técnico de entrega.

Principios:

- Workflow/GitHub siguen siendo canónicos;
- la caché es descartable;
- la caché no completa campos faltantes mediante inferencia;
- una caché ambigua o desactualizada no autoriza actuación.

## 10. Integración futura con Workflow

La representación interna podrá normalizar información equivalente a:

```text
sourceId
workItemRef
targetActor
humanRequired
contextRefs
revisionRef
```

Estos valores deben provenir de recursos que Workflow exponga.

No deben inventarse mediante la API.

El formato definitivo queda pendiente de revisar el contrato real de integración.

## 11. API de contextualización

La API se incorporará después de demostrar la actuación web y la integración básica con Workflow.

Entrada inicial:

- contexto mínimo pertinente;
- referencias explícitas;
- datos sin secretos.

Salida esperada:

```json
{
  "context_sufficient": true,
  "summary": "...",
  "attention": []
}
```

La salida deberá validarse antes de utilizarse.

## 12. Seguridad de contenido

El texto procedente de:

- Issues;
- PR;
- comentarios;
- documentación;
- código;

debe tratarse como datos.

No puede modificar por sí mismo las instrucciones privilegiadas del Actuador.

## 13. Registro

M1 debe registrar al menos:

- timestamp;
- destino;
- resultado técnico;
- código de error si existe.

En etapas posteriores podrá añadir:

- Work Item;
- referencia de origen;
- hash o referencia de prompt;
- flags de atención.

No se registrarán secretos.

## 14. GitHub Actions

Inicialmente se utilizará para:

```text
install
build
tests
quality checks
package
artifact
```

La sesión web real se ejecutará localmente.

## 15. Restricciones

Actuador no necesita inicialmente:

- base de datos;
- servicio residente;
- self-hosted runner;
- cola;
- sistema distribuido;
- almacenamiento vectorial;
- framework multiagente.

Estas decisiones solo se reconsiderarán si aparece una necesidad demostrada.
