# Shape Up (Basecamp)

## Qué es
Metodología de desarrollo de producto creada por Ryan Singer en Basecamp. Trabaja en ciclos de 6 semanas con 2 semanas de "cool-down" entre ciclos.

## Cuándo usarla
Equipos pequeños (1-3 personas) que necesitan entregar features completas sin micromanagement. Ideal para productos en crecimiento donde no quieres sprints cortos de Scrum.

## Etapas

### 1. Pitch (1-2 días)
Alguien escribe un pitch: el problema, la solución propuesta, los rabbit holes (riesgos), y lo que NO se incluye. No es un PRD detallado — es una apuesta clara.

**Documentos:** PRD, Problem Statement

### 2. Bet (1 día)
El equipo decide qué pitches "apostar" en el próximo ciclo. No hay backlog infinito — si no se apuesta, se descarta.

**Documentos:** RFC, ADR, Architecture Diagram

### 3. Build (6 semanas)
El equipo tiene autonomía total para construir. Sin daily standups. Reportan progreso con "hill charts" (subiendo la colina = descubriendo, bajando = ejecutando).

**Documentos:** Sprint Plan, API Spec, Test Plan

### 4. Cool-down (2 semanas)
Tiempo libre para bugs, exploración, refactoring, o prototipos del siguiente ciclo. No hay features asignadas.

**Documentos:** Runbook, Retrospectiva, Lessons Learned

## Definition of Done
- El pitch tiene problema + solución + appetite (cuánto tiempo vale invertir)
- El RFC tiene decisiones de arquitectura justificadas
- El Sprint Plan tiene scope fijo (lo que no cabe se corta, no se extiende)
- El Runbook cubre deploy, rollback, y monitoreo

## Fuente
- Libro: "Shape Up" de Ryan Singer (free en basecamp.com/shapeup)
