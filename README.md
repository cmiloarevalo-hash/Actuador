# Actuador

## Propósito

Actuador es un componente de apoyo al Workflow vigente del proyecto.

Su función es mantener continuidad operacional entre GitHub y los dos actores web del Workflow:

- Supervisor Web.
- Agente Implementador Web.

Actuador no sustituye el Workflow, no redefine sus reglas y no adquiere autoridad de ingeniería.

## Principio de operación

Workflow conserva la autoridad sobre:

- responsabilidades;
- estados de trabajo;
- alcance;
- revisión;
- decisiones;
- intervención humana;
- integración del trabajo.

Actuador se limita a consumir los recursos que Workflow expone y a ejecutar las capacidades que tenga permitidas.

Su comunicación con los actores web se realiza mediante **prompts**.

## Responsabilidades principales

Actuador puede:

- leer contexto permitido desde GitHub y la documentación del proyecto;
- mantener una caché local de contexto de Workflow para conservar sus límites y responsabilidades;
- preparar prompts a partir de una actuación permitida;
- entregar prompts al Supervisor o al Implementador mediante Playwright;
- registrar el resultado técnico de la entrega;
- esperar nueva evidencia persistente;
- advertir sobre problemas o inconsistencias sin resolverlos por sí mismo;
- detenerse cuando Workflow requiera una decisión humana o cuando no exista autorización suficiente.

Actuador no puede:

- modificar código;
- hacer commit, push, branch o merge;
- modificar alcance o criterios;
- aprobar cambios;
- decidir prioridades;
- corregir directamente al Implementador;
- sustituir al Supervisor;
- sustituir al Humano;
- redefinir Workflow.

## Fuente de verdad

GitHub y los recursos definidos por Workflow constituyen la referencia persistente del trabajo.

La caché local de Workflow es solo una ayuda operacional.

Si la caché es insuficiente, contradictoria o no puede considerarse vigente, Actuador debe volver a consultar la fuente correspondiente o detenerse.

## Desarrollo inicial

La primera etapa del desarrollo debe demostrar únicamente que Actuador puede:

1. iniciarse localmente;
2. abrir o focalizar una interfaz web configurada;
3. utilizar una sesión previamente autenticada;
4. localizar el campo de entrada;
5. insertar un prompt exacto;
6. verificar el contenido antes de enviarlo;
7. ejecutar un único envío;
8. registrar el resultado técnico;
9. terminar de forma controlada.

Las capacidades de integración con GitHub, contextualización mediante API y continuidad entre actores se incorporarán después, conforme al Workflow y a la evidencia obtenida durante el desarrollo.

## Documentación de ingeniería

La documentación canónica inicial se encuentra en:

```text
docs/engineering/
├── SOFTWARE_REQUIREMENTS_SPECIFICATION.md
├── SOFTWARE_ARCHITECTURE.md
├── TECHNICAL_SPECIFICATION.md
├── VERIFICATION_PLAN.md
└── adr/
    └── ADR-0001-WORKFLOW-BOUNDARY.md
```

Estos documentos describen la aplicación.

Workflow describe cómo se desarrolla, revisa y gobierna el trabajo sobre ella.
