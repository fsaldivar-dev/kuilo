# Wiki Links (@mention) + Backlinks

Enlaza páginas entre sí escribiendo `@` en el editor.

## @Mention

1. Escribe `@` en cualquier parte del editor
2. Aparece un dropdown con todas las páginas del vault
3. Filtra escribiendo → matchea por título y paquete
4. `↑` `↓` para navegar, `Enter` para insertar
5. El texto se inserta como un link azul con underline dashed

## Click para navegar

Click en cualquier wiki link → navega a esa página.

## Backlinks

El botón **Backlinks** en el header del documento muestra un panel lateral con todas las páginas que mencionan el documento actual.

- Busca por título del documento en todo el vault
- Click en un backlink para navegar a esa página
- Se actualiza al cambiar de documento

## Formato técnico

Los wiki links son un Tiptap `Mark` con tipo `wikiLink` y atributos:
- `title` — texto mostrado / título de la página destino
- `packageName` — paquete resuelto
- `pagePath` — path resuelto

En el HTML renderizado: `<a data-wiki-link class="wiki-link" title="..." href="#">texto</a>`
