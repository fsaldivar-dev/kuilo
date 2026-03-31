/**
 * markdown-bridge.js
 * Conversión bidireccional entre Markdown (.md) y HTML del editor Tiptap.
 *
 * markdownToHtml  — abre un .md en el SimpleEditor
 * htmlToMarkdown  — guarda los cambios del editor de vuelta como .md limpio
 */

import { marked } from "marked";
import TurndownService from "turndown";

// ─── markdownToHtml ───────────────────────────────────────────────────────────

// Configuración de marked: GFM (tablas, task lists, strikethrough) + breaks
marked.setOptions({
  gfm: true,
  breaks: false,
});

// Renderer personalizado para task lists GFM → formato Tiptap
const renderer = new marked.Renderer();

renderer.listitem = (item) => {
  // item.task === true cuando es - [ ] o - [x]
  if (item.task) {
    const checked = item.checked ? "true" : "false";
    // Tiptap TaskItem espera: <li data-type="taskItem" data-checked="...">
    return `<li data-type="taskItem" data-checked="${checked}"><label></label><div><p>${item.text.replace(/^\[[ x]\]\s*/i, "")}</p></div></li>`;
  }
  return `<li><p>${item.text}</p></li>`;
};

renderer.list = (token) => {
  const body = token.items.map((item) => renderer.listitem(item)).join("");
  if (token.ordered) return `<ol>${body}</ol>`;
  // Si algún item es task → taskList
  if (token.items.some((i) => i.task)) {
    return `<ul data-type="taskList">${body}</ul>`;
  }
  return `<ul>${body}</ul>`;
};

/**
 * Convierte Markdown a HTML compatible con el SimpleEditor (Tiptap).
 * @param {string} markdown
 * @returns {string} HTML
 */
export function markdownToHtml(markdown = "") {
  if (!markdown.trim()) return "<p></p>";
  return marked.parse(markdown, { renderer });
}

// ─── htmlToMarkdown ───────────────────────────────────────────────────────────

const td = new TurndownService({
  headingStyle:   "atx",       // # Heading
  hr:             "---",
  bulletListMarker: "-",
  codeBlockStyle: "fenced",    // ```
  fence:          "```",
  strongDelimiter: "**",
  emDelimiter:    "_",
});

// Regla para task items de Tiptap → - [ ] / - [x]
td.addRule("taskItem", {
  filter: (node) =>
    node.nodeName === "LI" && node.getAttribute("data-type") === "taskItem",
  replacement: (content, node) => {
    const checked = node.getAttribute("data-checked") === "true";
    // Limpia el contenido (quita párrafos internos innecesarios)
    const text = content.replace(/^\n+|\n+$/g, "").replace(/\n/g, " ");
    return `\n- [${checked ? "x" : " "}] ${text}\n`;
  },
});

// Regla para task list wrapper → no agrega nada (los items ya se manejan)
td.addRule("taskList", {
  filter: (node) =>
    node.nodeName === "UL" && node.getAttribute("data-type") === "taskList",
  replacement: (content) => `\n${content}\n`,
});

// Regla para callouts → > [!TYPE]
td.addRule("callout", {
  filter: (node) =>
    node.nodeName === "DIV" && node.getAttribute("data-type") === "callout",
  replacement: (content, node) => {
    const type = (node.getAttribute("data-callout") || "note").toUpperCase();
    const lines = content.trim().split("\n").map((l) => `> ${l}`).join("\n");
    return `\n> [!${type}]\n${lines}\n`;
  },
});

// Regla para code blocks con clase language-xxx → ```language
td.addRule("fencedCodeBlock", {
  filter: (node) =>
    node.nodeName === "PRE" && node.firstChild?.nodeName === "CODE",
  replacement: (content, node) => {
    const code = node.firstChild;
    const lang = (code.getAttribute("class") || "")
      .replace("language-", "")
      .replace("hljs ", "")
      .trim();
    const text = code.textContent || "";
    return `\n\`\`\`${lang}\n${text}\n\`\`\`\n`;
  },
});

/**
 * Convierte HTML del SimpleEditor de vuelta a Markdown limpio.
 * @param {string} html
 * @returns {string} Markdown
 */
export function htmlToMarkdown(html = "") {
  if (!html.trim()) return "";
  return td.turndown(html);
}
