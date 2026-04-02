# Callouts (Admonitions)

![Callouts](screenshots/callouts.png)

Bloques de alerta visual con 5 tipos, compatibles con GitHub Flavored Markdown.

## Tipos

| Tipo | Color | Uso |
|---|---|---|
| **Note** | Azul | Informacion adicional |
| **Tip** | Verde | Consejos y buenas practicas |
| **Important** | Morado | Informacion que no debe ignorarse |
| **Warning** | Amarillo | Precauciones y riesgos |
| **Caution** | Rojo | Peligro o acciones irreversibles |

## Insertar

- Slash command: `/note`, `/tip`, `/warning`, `/caution`, `/important`
- O escribe `> [!NOTE]` en markdown

## Export

Se exportan como blockquotes con formato GFM:
```markdown
> [!WARNING]
> Este proceso no se puede deshacer.
```

Compatible con GitHub, Obsidian, y cualquier renderer que soporte GFM admonitions.
