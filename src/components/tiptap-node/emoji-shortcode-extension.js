/**
 * Emoji shortcode input rule — converts :name: to emoji unicode on typing.
 * Example: :rocket: → 🚀, :check: → ✅
 */

import { Extension } from "@tiptap/core";
import { InputRule } from "@tiptap/core";
import { EMOJI_MAP } from "@/lib/emoji-shortcodes";

export const EmojiShortcode = Extension.create({
  name: "emojiShortcode",

  addInputRules() {
    return [
      new InputRule({
        // Match :shortcode: pattern (1-20 chars between colons)
        find: /:([a-z0-9_+-]{1,20}):$/,
        handler: ({ state, range, match }) => {
          const code = match[1];
          const emoji = EMOJI_MAP[code];
          if (!emoji) return;

          const { tr } = state;
          tr.replaceWith(range.from, range.to, state.schema.text(emoji));
        },
      }),
    ];
  },
});
