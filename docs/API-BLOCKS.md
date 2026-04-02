# API Endpoint Blocks


![API Blocks](screenshots/api-endpoint.png)

Bloques visuales para documentar APIs REST directamente en el editor.

## Insertar

`/api-endpoint` o botón `+` → API Endpoint

## Campos

- **Método** — selector: GET (verde), POST (azul), PUT (naranja), PATCH (morado), DELETE (rojo)
- **Path** — input monospace: `/api/users/:id`
- **Descripción** — texto libre
- **Auth** — tipo de autenticación

### Parámetros
- Tabla con: nombre, tipo (string/number/boolean/object/array), required (checkbox), descripción
- Botón `+` para agregar parámetros

### Request Body
- Solo aparece para POST/PUT/PATCH
- Textarea monospace para JSON

### Responses
- Múltiples responses (200, 400, 404, etc.)
- Status code coloreado: 2xx verde, 4xx naranja, 5xx rojo
- Body JSON por response
- Botón `+` para agregar más responses

## Export

En Markdown: header con método + path, tabla de parámetros, code blocks de request/response.

## Metadata Cards

Bloques de metadatos estructurados con campos tipados:
- **Select** — opciones precargadas (ej: Status: Draft → Review → Approved)
- **Date** — datepicker nativo con fecha de hoy por defecto
- **Text** — input libre con placeholder
