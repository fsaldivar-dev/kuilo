/**
 * blocks-to-markdown.js
 * Converts Tiptap JSON blocks to Markdown.
 * Handles custom blocks (charts → mermaid, API endpoints, callouts, etc.)
 */

import { chartToMermaid } from "./chart-to-mermaid";

function inlineText(content) {
  if (!content) return "";
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content.map((n) => {
    let text = n.text || "";
    if (n.marks) {
      for (const mark of n.marks) {
        if (mark.type === "bold") text = `**${text}**`;
        if (mark.type === "italic") text = `_${text}_`;
        if (mark.type === "strike") text = `~~${text}~~`;
        if (mark.type === "code") text = `\`${text}\``;
      }
    }
    return text;
  }).join("");
}

function blockToMd(block, depth = 0) {
  if (!block || !block.type) return "";

  switch (block.type) {
    case "heading": {
      const level = block.attrs?.level || block.props?.level || 1;
      return `${"#".repeat(level)} ${inlineText(block.content)}`;
    }
    case "paragraph":
      return inlineText(block.content);

    case "bulletList":
    case "bullet_list":
      return (block.content || []).map((li) => {
        const inner = (li.content || []).map((b) => blockToMd(b, depth)).join("\n");
        return `- ${inner}`;
      }).join("\n");

    case "orderedList":
    case "ordered_list":
      return (block.content || []).map((li, i) => {
        const inner = (li.content || []).map((b) => blockToMd(b, depth)).join("\n");
        return `${i + 1}. ${inner}`;
      }).join("\n");

    case "taskList":
    case "task_list":
      return (block.content || []).map((li) => {
        const checked = li.attrs?.checked ? "x" : " ";
        const inner = (li.content || []).map((b) => blockToMd(b, depth)).join("\n");
        return `- [${checked}] ${inner}`;
      }).join("\n");

    case "blockquote":
    case "quote": {
      const text = typeof block.content === "string" ? block.content : (block.content || []).map((b) => blockToMd(b, depth)).join("\n");
      return text.split("\n").map((l) => `> ${l}`).join("\n");
    }

    case "codeBlock":
    case "code_block": {
      const lang = block.attrs?.language || block.props?.language || "";
      const code = typeof block.content === "string" ? block.content : inlineText(block.content);
      return `\`\`\`${lang}\n${code}\n\`\`\``;
    }

    case "horizontalRule":
    case "divider":
      return "---";

    case "callout": {
      const type = (block.attrs?.type || "note").toUpperCase();
      const inner = (block.content || []).map((b) => blockToMd(b, depth)).join("\n");
      return `> [!${type}]\n${inner.split("\n").map((l) => `> ${l}`).join("\n")}`;
    }

    case "kanbanBlock": {
      const board = safeParse(block.attrs?.board);
      if (!board.columns?.length) return "";
      return board.columns.map((col) => {
        const header = `### ${col.title}`;
        const cards = (col.cards || []).map((c) => `- [ ] ${c.title}`).join("\n");
        return `${header}\n${cards || "_(vacío)_"}`;
      }).join("\n\n");
    }

    case "diagramBlock": {
      const code = block.attrs?.mermaid || "";
      return `\`\`\`mermaid\n${code}\n\`\`\``;
    }

    case "chartBlock": {
      const mermaid = chartToMermaid(block.attrs || {});
      return `\`\`\`mermaid\n${mermaid}\n\`\`\``;
    }

    case "apiEndpoint": {
      const a = block.attrs || {};
      const params = safeParse(a.params);
      const responses = safeParse(a.responses);
      let md = `### ${a.method || "GET"} \`${a.path || "/"}\`\n\n`;
      if (a.description) md += `${a.description}\n\n`;
      if (a.auth) md += `**Auth:** ${a.auth}\n\n`;
      if (params.length) {
        md += "**Parameters:**\n\n| Name | Type | Required | Description |\n|---|---|---|---|\n";
        md += params.map((p) => `| ${p.name} | ${p.type} | ${p.required ? "Yes" : "No"} | ${p.description || ""} |`).join("\n") + "\n\n";
      }
      if (a.requestBody) md += `**Request Body:**\n\`\`\`json\n${a.requestBody}\n\`\`\`\n\n`;
      if (responses.length) {
        for (const r of responses) {
          md += `**${r.status}** ${r.description || ""}\n`;
          if (r.body) md += `\`\`\`json\n${r.body}\n\`\`\`\n`;
        }
      }
      return md;
    }

    case "metadataCard": {
      const fields = safeParse(block.attrs?.fields);
      if (!fields.length) return "";
      return "| Campo | Valor |\n|---|---|\n" + fields.map((f) => `| ${f.key} | ${f.value || ""} |`).join("\n");
    }

    case "table": {
      const rows = block.content || [];
      if (!rows.length) return "";
      return rows.map((row, ri) => {
        const cells = (row.content || []).map((cell) => {
          return (cell.content || []).map((b) => blockToMd(b)).join(" ");
        });
        const line = `| ${cells.join(" | ")} |`;
        if (ri === 0) return `${line}\n|${cells.map(() => "---").join("|")}|`;
        return line;
      }).join("\n");
    }

    case "columns":
      return (block.content || []).map((col) =>
        (col.content || []).map((b) => blockToMd(b, depth)).join("\n\n")
      ).join("\n\n---\n\n");

    case "mathBlock":
      return `$$\n${inlineText(block.content)}\n$$`;

    case "tableOfContents":
      return `[TOC]`;

    default:
      // Unknown block — try to extract text
      if (typeof block.content === "string") return block.content;
      if (Array.isArray(block.content)) return block.content.map((b) => blockToMd(b, depth)).join("\n");
      return "";
  }
}

function safeParse(val) {
  try { return JSON.parse(val || "[]"); } catch { return []; }
}

/**
 * Convert Tiptap JSON blocks array to Markdown string.
 */
export function blocksToMarkdown(blocks = []) {
  return blocks.map((b) => blockToMd(b)).filter(Boolean).join("\n\n");
}
