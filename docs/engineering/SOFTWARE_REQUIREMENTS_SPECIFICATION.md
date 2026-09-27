# Software Requirements Specification

## 1. Propósito

Este documento define los requisitos generales iniciales de Actuador.

Se mantiene intencionalmente ligero. Los detalles de implementación se desarrollarán progresivamente mediante Workflow.

## 2. Objetivo del producto

Actuador debe facilitar la continuidad del trabajo entre GitHub, Supervisor Web y Agente Implementador Web sin asumir funciones de ingeniería reservadas a otros participantes.

## 3. Dependencia de Workflow

Actuador opera bajo el Workflow vigente.

Workflow define:

- autoridad;
- responsabilidades;
- condiciones de continuidad;
- condiciones de detención;
- intervención humana;
- reglas de revisión e integración.

Actuador no mantiene una segunda definición de esas reglas.

## 4. Requisitos funcionales

### FR-01 — Lectura de contexto

Actuador debe poder leer el contexto que Workflow le permita consultar.

El contexto puede incluir, según corresponda:

- Work Item / Issue;
- PR relacionado;
- SHA o revisión pertinente;
- CI pertinente;
- documentación referenciada;
- señales de Workflow;
- última actuación procesada.

La lectura debe limitarse al contexto necesario.

### FR-02 — Caché de contexto de Workflow

Actuador debe poder conservar localmente una representación mínima de las directrices y referencias de Workflow necesarias para:

- recordar sus responsabilidades;
- reconocer sus límites;
- preparar una actuación;
- evitar confundir una interpretación propia con una autorización.

La caché no sustituye la fuente canónica.

Si existe duda sobre su vigencia o coherencia, Actuador debe consultar nuevamente la fuente correspondiente o detenerse.

### FR-03 — Comunicación mediante prompts

Actuador debe comunicarse con Supervisor Web y Agente Implementador Web mediante prompts.

Los prompts deben:

- corresponder a una actuación permitida;
- contener solo el contexto necesario;
- respetar el rol del destinatario;
- no conceder autoridad adicional;
- no incluir decisiones inventadas por Actuador.

### FR-04 — Entrega mediante interfaz web

Actuador debe poder utilizar Playwright para:

- abrir o focalizar el actor configurado;
- verificar la sesión;
- localizar el campo de entrada;
- insertar el prompt;
- comprobar el texto insertado;
- ejecutar un único envío;
- registrar el resultado técnico.

### FR-05 — Registro técnico

Actuador debe registrar un resultado técnico suficiente para saber si una entrega:

- terminó correctamente;
- falló antes del envío;
- quedó incierta después del envío.

### FR-06 — Lectura contextual mediante API

En una etapa posterior, Actuador podrá utilizar una API de modelo para contextualizar información acotada.

La API podrá ayudar a:

- resumir;
- identificar contexto insuficiente;
- señalar posibles contradicciones;
- señalar posibles repeticiones;
- señalar posibles desviaciones;
- recomendar revisión.

La API no podrá decidir autoridad, aprobación, prioridad, alcance, merge, rework o fin de una espera humana.

### FR-07 — Escalamiento al Supervisor

Cuando Actuador detecte una anomalía de ingeniería, no debe corregirla.

Debe detener la actuación dudosa y utilizar únicamente el mecanismo de escalamiento que Workflow permita.

El Supervisor conserva la decisión sobre cómo continuar.

### FR-08 — Intervención humana

Cuando Workflow indique que una actividad requiere intervención humana, Actuador debe esperar.

No puede levantar esa condición por inferencia propia ni por salida de la API.

### FR-09 — Continuidad entre actividades

Actuador puede mantener referencia de actividades pendientes o disponibles, pero no puede decidir cuál tiene prioridad.

La prioridad corresponde a Workflow, Supervisor o Humano según corresponda.

## 5. Requisitos de seguridad y control

### SR-01

Actuador no debe modificar código del proyecto.

### SR-02

Actuador no debe ejecutar commit, push, branch, PR o merge por autoridad propia.

### SR-03

Actuador no debe almacenar secretos en archivos versionados.

### SR-04

El perfil del navegador debe mantenerse fuera del repositorio o ignorado explícitamente.

### SR-05

La API no debe controlar libremente Playwright.

### SR-06

El contenido recuperado desde GitHub debe tratarse como datos, no como instrucciones privilegiadas.

### SR-07

Ante una autorización ambigua, Actuador debe detenerse.

## 6. Fuera de alcance inicial

No forman parte de la primera etapa:

- integración completa con GitHub;
- API de contextualización;
- coordinación completa Supervisor ↔ Implementador;
- detección de desviaciones;
- múltiples Work Items simultáneos;
- servicio residente;
- base de datos;
- infraestructura distribuida.

## 7. Criterio general de éxito

Actuador es útil si reduce trabajo mecánico y conserva continuidad sin adquirir responsabilidades que pertenecen a Workflow, Supervisor, Implementador o Humano.
