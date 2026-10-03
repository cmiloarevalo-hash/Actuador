# Actuador

## Propósito

Actuador es un componente de apoyo al Workflow vigente del proyecto. Workflow conserva la autoridad sobre responsabilidades, estados, alcance, revisión, decisiones, intervención humana e integración. Actuador no sustituye al Workflow, al Supervisor, al Implementador ni al Humano.

## M1 — Playwright Prompt Delivery Test

M1 demuestra únicamente la entrega local de un prompt a una interfaz web previamente autenticada. No integra GitHub en tiempo de ejecución, API de modelo, Workflow Adapter, coordinación entre actores, polling, daemon ni base de datos.

El flujo implementado es:

```text
START
↓
abrir Chromium gestionado por Playwright con perfil dedicado
↓
verificar marcador de sesión
↓
verificar URL y marcador del destino
↓
localizar inequívocamente el input
↓
insertar el prompt exacto
↓
leer y comparar el prompt
↓
verificar que el control Send está disponible
↓
click Send exactamente una vez
↓
confirmar que el prompt dejó el input
↓
registrar resultado
↓
cierre controlado
```

La única primitiva de envío es `click` sobre el control Send configurado. No se usa Enter. Si se alcanza el límite de envío y el resultado posterior queda incierto, la ejecución registra `UNCERTAIN_AFTER_SEND` y termina sin reintentar.

## Requisitos

- Node.js 22 o posterior.
- Chromium instalado mediante el CLI de la versión fijada de `playwright-core`.
- Sesión del destino iniciada manualmente en un perfil dedicado a Actuador.

Instalación y verificación:

```text
npm ci
npm run build
npm test
```

GitHub Actions ejecuta esos pasos sin abrir navegador ni utilizar una sesión web local.

## Configuración local

`config/actuator.config.json` es una configuración inerte de ejemplo. Para una prueba real, copiarla como:

```text
config/actuator.config.local.json
```

Ese archivo está ignorado por Git y puede contener la URL, selectores y prompt específicos de la prueba. No debe contener credenciales ni secretos.

Campos relevantes:

- `destinationName`: etiqueta no sensible usada en logs.
- `targetUrl`: URL que Playwright abre.
- `expectedUrlPrefix`: prefijo que debe cumplir la URL antes de actuar.
- `profileDir`: perfil persistente y dedicado; por defecto se ubica en `.actuador/playwright-profile` y queda ignorado.
- `prompt`: texto exacto que se insertará una única vez.
- `selectors.sessionMarker`: elemento visible solo cuando la sesión requerida está disponible.
- `selectors.destinationMarker`: elemento que identifica inequívocamente el destino.
- `selectors.promptInput`: campo de entrada.
- `selectors.sendButton`: único control usado para el envío.

Los localizadores admiten `role`, `label`, `placeholder` y `css`. Deben preferirse `role`, luego `label` o `placeholder`; `css` queda como contrato específico cuando no existe una opción semántica estable.

## Perfil dedicado y login manual

Instala el navegador gestionado localmente con `npx playwright-core install chromium` y verifica la instalación con `npx playwright-core install --list`. El código nunca introduce credenciales. Antes de la prueba de entrega, el Humano debe abrir Chromium usando el mismo directorio configurado en `profileDir`, iniciar sesión manualmente y cerrar el navegador. Después, `scripts\START.bat` reutiliza ese perfil persistente mediante Playwright.

El perfil y los logs bajo `.actuador/` no se versionan ni se publican como artifacts.

## Inicio en Windows

Con dependencias instaladas y la sesión preparada:

```text
scripts\START.bat
```

Si existe `config\actuator.config.local.json`, `START.bat` lo utiliza. También puede indicarse otra ruta mediante la variable `ACTUATOR_CONFIG`.

## Resultados técnicos

Cada ejecución termina con exactamente uno de estos resultados:

```text
SUCCESS
FAILED_BEFORE_SEND
UNCERTAIN_AFTER_SEND
```

El log JSONL contiene timestamp, `destinationName`, resultado y código de error cuando corresponde. No registra el prompt, credenciales ni la ruta del perfil.

## Prueba local controlada de M1

La prueba web autenticada real se ejecuta únicamente de forma local:

1. preparar el perfil dedicado con login manual;
2. crear `config/actuator.config.local.json` con el destino real, prompt de prueba y localizadores inequívocos;
3. cerrar cualquier navegador que mantenga bloqueado ese perfil;
4. ejecutar `scripts\START.bat`;
5. verificar que aparece un solo mensaje correspondiente al prompt exacto;
6. comprobar el resultado en `.actuador/logs/actuation-YYYY-MM-DD.jsonl`;
7. para probar `FAILED_BEFORE_SEND`, usar de forma controlada una sesión/destino/localizador inválido y comprobar que no se envía nada;
8. para una condición incierta posterior al Send, provocar únicamente una falla de confirmación después del click y verificar que no existe segundo envío.

La evidencia que se publique no debe incluir credenciales, cookies, contenido sensible de la conversación ni el perfil del navegador.

## Documentación de ingeniería

La documentación canónica permanece en `docs/engineering/**`. M1 implementa solamente la primera etapa definida allí y no modifica esa documentación.
