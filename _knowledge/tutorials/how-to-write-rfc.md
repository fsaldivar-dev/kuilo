# Cómo escribir un RFC

## Qué es
Request for Comments — propuesta de diseño técnico que busca feedback antes de implementar.

## Cuándo escribirlo
Después del PRD (necesitas saber QUÉ construir). Antes del Sprint Plan (necesitas saber CÓMO).

## Estructura

### 1. Contexto
¿Por qué estamos haciendo esto? Link al PRD. 2-3 líneas.

### 2. Propuesta
¿Cómo lo vamos a construir? Diagrama de arquitectura, flujo de datos, API contracts.

### 3. Alternativas consideradas
¿Qué otras opciones evaluaste? ¿Por qué no esas? Esto muestra que pensaste.

### 4. Trade-offs
¿Qué ganamos y qué perdemos con esta decisión? Sé honesto.

### 5. Riesgos / Rabbit holes
¿Dónde puede fallar? ¿Qué no sabemos? Mejor descubrirlo ahora que en sprint 3.

### 6. Plan de migración (si aplica)
¿Cómo pasamos del estado actual al nuevo? ¿Hay downtime? ¿Es reversible?

### 7. Decisión
Accepted / Rejected / Deferred. Con fecha y quién decidió.

## Errores comunes
- RFC sin alternativas → parece que no investigaste
- RFC demasiado detallado → no es código, es diseño
- RFC sin riesgos → no estás siendo honesto
- RFC que nadie leyó → si no hay comments, no es un RFC

## Checklist de review
- [ ] ¿Linkea al PRD correspondiente?
- [ ] ¿Tiene diagrama de arquitectura?
- [ ] ¿Lista al menos 2 alternativas?
- [ ] ¿Los trade-offs son honestos?
- [ ] ¿Los riesgos tienen mitigación?
