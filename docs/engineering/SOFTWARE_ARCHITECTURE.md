# Software Architecture

## 1. Objetivo

Definir la arquitectura general de Actuador sin fijar detalles que deben resolverse durante la implementación mediante Workflow.

## 2. Principio arquitectónico

Actuador está subordinado a Workflow.

```text
Workflow
    determina autoridad y reglas

Supervisor
    decide

Implementador
    modifica el producto

Humano
    resuelve las decisiones reservadas

Actuador
    lee
    contextualiza
    prepara prompts
    entrega
    registra
    espera
```

## 3. Arquitectura conceptual

```text
                         HUMANO
                            │
                   decisiones reservadas
                            │
                            ▼
                       WORKFLOW
                            │
                     GitHub / estado
                            │
                            ▼
                  ┌─────────────────┐
                  │    ACTUADOR     │
                  │                 │
                  │ lectura         │
                  │ caché Workflow  │
                  │ contexto        │
                  │ prompts         │
                  │ Playwright      │
                  │ registro        │
                  └───────┬─────────┘
                          │
                ┌─────────┴─────────┐
                ▼                   ▼
           SUPERVISOR WEB      IMPLEMENTADOR WEB
                │                   │
                └─────────┬─────────┘
                          ▼
                        GitHub
```

## 4. Componentes lógicos

### 4.1 Actuation Core

Coordina una actuación permitida.

No contiene reglas de ingeniería del Workflow.

### 4.2 Workflow Context Cache

Mantiene una copia local mínima de contexto necesario para que Actuador conserve:

- su rol;
- límites;
- referencias vigentes;
- última actuación conocida;
- información necesaria para preparar la siguiente entrega.

La caché:

- es de solo apoyo;
- no crea autoridad;
- no reemplaza GitHub ni Workflow;
- debe poder invalidarse o actualizarse.

### 4.3 Workflow Adapter

Componente futuro.

Su responsabilidad será traducir recursos existentes de Workflow/GitHub a una representación interna utilizable por Actuador.

No debe crear nuevos estados de Workflow.

### 4.4 Prompt Builder

Construye prompts a partir de:

- actuación autorizada;
- destinatario;
- contexto mínimo;
- plantillas definidas.

No toma decisiones de ingeniería.

### 4.5 Playwright Driver

Ejecuta una lista pequeña de acciones conocidas sobre las interfaces web.

No recibe comandos arbitrarios generados por un modelo.

### 4.6 Context Service

Componente futuro.

Puede utilizar una API de modelo para contextualización consultiva.

No controla autoridad ni transiciones.

### 4.7 Operational Log

Registra resultados técnicos de actuación.

No reemplaza la evidencia de ingeniería en GitHub.

## 5. Flujo general futuro

```text
Workflow / GitHub
        ↓
Workflow Adapter
        ↓
Actuador
        ↓
Context Cache
        ↓
Prompt Builder
        ↓
Playwright Driver
        ↓
actor autorizado
        ↓
GitHub
```

La API de contextualización, cuando exista, se inserta solo como apoyo:

```text
contexto acotado
        ↓
Context Service
        ↓
resumen / alertas
        ↓
validación del Actuador
```

## 6. Frontera de autoridad

Actuador puede:

- observar;
- contextualizar;
- advertir;
- entregar;
- esperar.

Actuador no puede:

- decidir ingeniería;
- corregir código;
- aprobar;
- priorizar;
- cambiar alcance;
- sustituir al Supervisor;
- sustituir al Implementador;
- sustituir al Humano.

## 7. Manejo general de errores

### Fallo operacional

Ejemplos:

- sesión inválida;
- destino incorrecto;
- input no disponible;
- prompt incorrecto;
- página inesperada.

Respuesta:

```text
STOP
→ registrar
```

### Anomalía de ingeniería

Ejemplos:

- posible desviación;
- contradicción;
- contexto aparentemente insuficiente.

Respuesta:

```text
NO resolver
→ detener actuación dudosa
→ escalar solo por vía permitida por Workflow
```

### Restricción humana

Respuesta:

```text
WAIT
```

## 8. Decisiones que se posponen

Se definirán mediante Workflow cuando exista evidencia suficiente:

- formato definitivo del Adapter;
- mecanismo GitHub concreto;
- modelo de API;
- estrategia de refresco de caché;
- persistencia mínima;
- polling o eventos;
- detección de loops;
- soporte para varias actividades.

## 9. Criterio de evolución

La arquitectura debe crecer solamente cuando una necesidad observada lo justifique.
