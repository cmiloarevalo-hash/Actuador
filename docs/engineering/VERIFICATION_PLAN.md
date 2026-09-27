# Verification Plan

## 1. Propósito

Definir cómo se verifican las primeras capacidades de Actuador.

Este plan crecerá junto con la aplicación.

## 2. Principio

Cada etapa debe probar una capacidad concreta antes de incorporar la siguiente.

La evidencia debe permitir distinguir:

- fallo de Actuador;
- fallo de interfaz;
- condición incierta;
- comportamiento esperado.

## 3. M1 — hipótesis

M1 debe responder:

> ¿Puede una aplicación local operar de forma reproducible una interfaz web ya autenticada y entregar exactamente un prompt al destino previsto?

## 4. M1 — criterios de aceptación

M1 se considera demostrado cuando:

1. el paquete descargable inicia;
2. abre el navegador;
3. utiliza un perfil dedicado;
4. reutiliza una sesión ya autenticada;
5. alcanza el destino configurado;
6. identifica el campo de entrada;
7. inserta exactamente el prompt configurado;
8. verifica el contenido antes del envío;
9. ejecuta una sola acción de envío;
10. registra un resultado técnico;
11. termina controladamente.

## 5. Resultados permitidos

```text
SUCCESS
FAILED_BEFORE_SEND
UNCERTAIN_AFTER_SEND
```

## 6. Casos mínimos a probar

### Caso 1 — entrega correcta

Esperado:

```text
SUCCESS
```

### Caso 2 — sesión inválida

Esperado:

```text
FAILED_BEFORE_SEND
```

### Caso 3 — destino incorrecto

Esperado:

```text
FAILED_BEFORE_SEND
```

### Caso 4 — input no encontrado

Esperado:

```text
FAILED_BEFORE_SEND
```

### Caso 5 — prompt insertado distinto

Esperado:

```text
FAILED_BEFORE_SEND
```

### Caso 6 — fallo inmediatamente después de Send

Esperado:

```text
UNCERTAIN_AFTER_SEND
```

No se debe reenviar automáticamente.

### Caso 7 — perfil bloqueado

Esperado:

```text
FAILED_BEFORE_SEND
```

## 7. Evidencia de M1

La evidencia mínima puede incluir:

- log de ejecución;
- resultado técnico;
- código de error;
- trazas de diagnóstico cuando corresponda.

Las trazas no deben publicarse si contienen información sensible.

## 8. Lo que M1 no verifica

M1 no verifica:

- calidad de la respuesta del actor;
- comunicación Supervisor ↔ Implementador;
- GitHub Handoff;
- API;
- lectura de Workflow;
- intervención humana;
- detección de desviaciones;
- coordinación de Work Items.

## 9. Verificación futura — integración con Workflow

Cuando se incorpore la integración, deberán probarse al menos:

- reconocimiento de una actuación permitida;
- actor autorizado;
- condición de espera humana;
- actualización de contexto;
- actuación duplicada;
- actuación incierta;
- ausencia de autorización.

Resultado esperado ante ausencia de autorización:

```text
NO DELIVERY
```

## 10. Verificación futura — API

Se deberán incluir casos como:

- contexto suficiente;
- contexto insuficiente;
- información contradictoria;
- posible repetición;
- posible desviación;
- contenido con instrucciones hostiles.

La API no deberá ser capaz de modificar autoridad o producir acciones fuera de las funciones permitidas.

## 11. Regresión

Cada capacidad incorporada deberá mantener las restricciones anteriores.

En particular, ninguna evolución debe conceder al Actuador capacidad para:

- modificar código;
- decidir aprobación;
- cambiar prioridades;
- modificar Workflow;
- levantar una espera humana.

## 12. Criterio de avance

Solo se amplía el sistema cuando la etapa anterior esté demostrada con evidencia reproducible.
