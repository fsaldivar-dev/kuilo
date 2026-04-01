import { Mark, markInputRule } from "@tiptap/core";

/**
 * WikiLink Mark — renders [[page title]] as clickable internal links.
 *
 * Attrs:
 *   - title: display text (also used to resolve the target page)
 *   - packageName: resolved package (optional, set on click)
 *   - pagePath: resolved path (optional, set on click)
 *
 * The input rule triggers on `[[text]]` and wraps "text" with this mark.
 */
export const WikiLink = Mark.create({
  name: "wikiLink",
  priority: 1000,
  keepOnSplit: false,

  addAttributes() {
    return {
      title: { default: null },
      packageName: { default: null },
      pagePath: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'a[data-wiki-link]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "a",
      {
        "data-wiki-link": "",
        class: "wiki-link",
        title: HTMLAttributes.title || "",
        href: "#",
      },
      0,
    ];
  },

  addInputRules() {
    // Match [[anything]] — captures the text between brackets
    return [
      markInputRule({
        find: /\[\[([^\]]+)\]\]$/,
        type: this.type,
        getAttributes: (match) => ({ title: match[1] }),
      }),
    ];
  },
});
