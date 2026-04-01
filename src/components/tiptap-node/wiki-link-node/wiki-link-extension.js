import { Mark, Extension } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";
import { PluginKey } from "@tiptap/pm/state";

/**
 * WikiLink Mark — renders page mentions as clickable internal links.
 * Created by the @mention suggestion, not by typing [[...]].
 */
export const WikiLink = Mark.create({
  name: "wikiLink",
  priority: 1000,
  keepOnSplit: false,
  inclusive: false,

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
});

/**
 * PageMention Extension — triggers on "@" and shows a dropdown of pages.
 * On select, inserts the page title wrapped in a WikiLink mark.
 */
export const buildPageMentionExtension = ({ getPages, onOpen, onUpdate, onClose }) =>
  Extension.create({
    name: "pageMention",

    addOptions() {
      return {
        suggestion: {
          char: "@",
          allowSpaces: true,
          startOfLine: false,

          items: ({ query }) => {
            const pages = getPages();
            if (!query.trim()) return pages.slice(0, 12);
            const q = query.toLowerCase();
            return pages
              .filter((p) => p.title.toLowerCase().includes(q) || p.packageName?.toLowerCase().includes(q))
              .slice(0, 12);
          },

          command: ({ editor, range, props }) => {
            editor
              .chain()
              .focus()
              .deleteRange(range)
              .insertContent({
                type: "text",
                text: props.title,
                marks: [{
                  type: "wikiLink",
                  attrs: {
                    title: props.title,
                    packageName: props.packageName,
                    pagePath: props.pagePath,
                  },
                }],
              })
              .run();
          },

          render: () => ({
            onStart: (props) => onOpen(props),
            onUpdate: (props) => onUpdate(props),
            onExit: () => onClose(),
            onKeyDown: ({ event }) => {
              if (["ArrowUp", "ArrowDown", "Enter", "Escape"].includes(event.key)) {
                return true;
              }
              return false;
            },
          }),
        },
      };
    },

    addProseMirrorPlugins() {
      return [
        Suggestion({
          editor: this.editor,
          pluginKey: new PluginKey("pageMention"),
          ...this.options.suggestion,
        }),
      ];
    },
  });
