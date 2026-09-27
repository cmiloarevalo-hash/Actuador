# ADR-0001 — Workflow como frontera de autoridad del Actuador

## Estado

Propuesto para revisión inicial.

## Contexto

Actuador se incorpora a un proyecto que ya utiliza un Workflow de ingeniería.

Workflow define responsabilidades, autoridad, estado del trabajo, revisión, decisiones e intervención humana.

Actuador necesita leer suficiente contexto para mantener continuidad y preparar prompts, pero no debe transformarse en un nuevo Supervisor ni en un nuevo Implementador.

## Decisión

Actuador se diseña como actor subordinado a Workflow.

Las responsabilidades se separan así:

```text
Workflow
→ autoridad y reglas

Supervisor
→ decisiones de ingeniería

Implementador
→ cambios sobre el producto

Humano
→ decisiones reservadas

Actuador
→ lectura, contexto, prompts, entrega, registro y espera
```

Actuador podrá mantener una caché local mínima de contexto de Workflow.

Esa caché:

- no es fuente de verdad;
- no crea estados;
- no completa autoridad faltante;
- puede descartarse y reconstruirse;
- debe ceder siempre ante la información canónica de Workflow/GitHub.

## Consecuencias

### Positivas

- reduce el riesgo de duplicar Workflow;
- limita el impacto de un error del Actuador;
- permite que el Actuador tenga buena capacidad de lectura sin adquirir autoridad;
- mantiene al Supervisor como punto de decisión;
- mantiene al Implementador como actor responsable de modificar código;
- permite evolucionar el Actuador sin redefinir la gobernanza del proyecto.

### Restricciones

El Actuador no podrá:

- modificar código;
- aprobar;
- hacer merge;
- cambiar alcance;
- cambiar prioridades;
- decidir rework;
- levantar una espera humana;
- inventar una actuación cuando Workflow no la exponga.

## Manejo de anomalías

Cuando exista un problema de ingeniería:

```text
Actuador
→ no corrige
→ detiene la actuación dudosa
→ informa por la vía que Workflow permita
→ Supervisor decide
```

Cuando exista un fallo operacional:

```text
Actuador
→ STOP
→ registrar
```

Cuando Workflow requiera intervención humana:

```text
Actuador
→ WAIT
```

## Alcance de esta decisión

Este ADR define una frontera arquitectónica.

No define el mecanismo concreto de integración con Workflow.

Ese mecanismo se decidirá posteriormente usando los recursos que Workflow realmente exponga.
