# Cómo escribir un PRD

## Qué es
Product Requirements Document — el contrato entre producto y desarrollo sobre qué se va a construir.

## Cuándo escribirlo
Después de tener Personas y Lean Canvas. Antes de cualquier RFC o diseño técnico.

## Estructura (sección por sección)

### 1. Resumen ejecutivo (3-5 líneas)
¿Qué estamos construyendo y por qué ahora? Un párrafo que cualquiera entienda.

### 2. Problema
¿Qué dolor tiene el usuario? Usa datos de User Research y Interviews. No inventes — cita.

### 3. Personas
¿Para quién? Referencia tu Customer Persona. Si no tienes → escríbelo primero.

### 4. Solución propuesta
¿Qué vamos a hacer? Descripción funcional — no técnica. "El usuario puede X" no "usaremos Redis para Y".

### 5. User stories
Formato: "Como [persona], quiero [acción], para [beneficio]".
Máximo 10. Si tienes más, tu scope es muy grande.

### 6. Lo que NO incluye
Explícitamente: qué se queda fuera. Esto evita scope creep.

### 7. Métricas de éxito
¿Cómo sabremos que funcionó? Al menos 1 métrica cuantitativa.
Ejemplo: "Reducir tiempo de onboarding de 15min a 5min"

### 8. Timeline
No fechas exactas — appetite: ¿cuánto tiempo vale invertir? (Shape Up)
"Esto vale 6 semanas" no "entrega el 15 de marzo".

## Errores comunes
- PRD sin métricas → no sabes si ganaste
- PRD con solución técnica → eso va en el RFC
- PRD que describe todo → si no cabe en 2 páginas, es muy grande
- PRD sin "lo que NO incluye" → scope creep garantizado

## Checklist de review
- [ ] ¿Tiene datos reales (no suposiciones)?
- [ ] ¿Las personas son las del Customer Persona?
- [ ] ¿Las métricas son medibles?
- [ ] ¿El scope es claro (incluye Y no-incluye)?
- [ ] ¿Cualquier persona del equipo lo entiende en 5 minutos?
