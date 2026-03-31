/**
 * SlashCommandExtension
 * Tiptap extension que activa el menú al escribir "/".
 * Delega el renderizado al componente React a través de callbacks.
 */

import { Extension } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";
import { filterCommands } from "@/lib/slash-commands";

export const buildSlashCommandExtension = ({ onOpen, onUpdate, onClose }) =>
  Extension.create({
    name: "slashCommands",

    addOptions() {
      return {
        suggestion: {
          char: "/",
          allowSpaces: false,
          startOfLine: false,

          items: ({ query }) => filterCommands(query),

          command: ({ editor, range, props }) => {
            props.execute({ editor, range });
          },

          render: () => ({
            onStart: (props) => onOpen(props),
            onUpdate: (props) => onUpdate(props),
            onExit: () => onClose(),
            onKeyDown: ({ event }) => {
              // Señala al menú React que maneje las teclas
              if (["ArrowUp", "ArrowDown", "Enter", "Escape"].includes(event.key)) {
                return true; // impide que el editor consuma la tecla
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
          ...this.options.suggestion,
        }),
      ];
    },
  });
