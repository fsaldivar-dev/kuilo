/**
 * page-document.js
 * Serialización bidireccional entre page.json ↔ HTML del editor Tiptap.
 *
 * Reglas de diseño:
 * - `content` en cada bloque = texto plano (para búsqueda, títulos, meta)
 * - `html`    en cada bloque = innerHTML rico (preserva bold/italic/links/etc.)
 * - blockToHtml usa `html` cuando existe, fallback a escapeHtml(content)
 * - Esta separación permite que meta.title sea siempre texto limpio
 */

export const escapeHtml = (value = "") =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export const stripHtmlTags = (value = "") => value.replace(/<[^>]+>/g, "");

export const createBlockId = () =>
  `blk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

// ─── blockToHtml ─────────────────────────────────────────────────────────────

export const blockToHtml = (block) => {
  // Rich HTML field takes precedence; fall back to escaped plain text.
  // Guard: content may be an array (lists) — only stringify scalars.
  const rawContent = typeof block.content === "string" ? block.content : "";
  const richContent = (block.html !== undefined && block.html !== null)
    ? block.html
    : escapeHtml(rawContent);

  if (block.type === "heading") {
    const level = Math.min(Math.max(block.props?.level || 1, 1), 3);
    return `<h${level}>${richContent}</h${level}>`;
  }

  if (block.type === "paragraph") {
    return `<p>${richContent}</p>`;
  }

  if (block.type === "bullet_list") {
    const items = Array.isArray(block.content) ? block.content : [];
    return `<ul>${items.map((item) => {
      const itemHtml = typeof item === "object" ? (item.html || escapeHtml(item.text || "")) : escapeHtml(item);
      return `<li><p>${itemHtml}</p></li>`;
    }).join("")}</ul>`;
  }

  if (block.type === "ordered_list") {
    const items = Array.isArray(block.content) ? block.content : [];
    return `<ol>${items.map((item) => {
      const itemHtml = typeof item === "object" ? (item.html || escapeHtml(item.text || "")) : escapeHtml(item);
      return `<li><p>${itemHtml}</p></li>`;
    }).join("")}</ol>`;
  }

  if (block.type === "task_list" || block.type === "check_list") {
    const items = Array.isArray(block.content) ? block.content : [];
    return `<ul data-type="taskList">${items.map((item) => {
      const label = typeof item === "string" ? item : item.label || "";
      const labelHtml = typeof item === "object" && item.html ? item.html : escapeHtml(label);
      const checked = typeof item === "object" && item.checked;
      return `<li data-type="taskItem" data-checked="${checked}"><label></label><div><p>${labelHtml}</p></div></li>`;
    }).join("")}</ul>`;
  }

  if (block.type === "quote") {
    return `<blockquote><p>${richContent}</p></blockquote>`;
  }

  if (block.type === "callout") {
    const tone = block.props?.tone || "info";
    return `<div data-callout-block tone="${escapeHtml(tone)}" class="callout-block tone-${escapeHtml(tone)}"><p>${richContent}</p></div>`;
  }

  if (block.type === "divider") return "<hr>";

  if (block.type === "code_block") {
    return `<pre><code>${escapeHtml(block.content || "")}</code></pre>`;
  }

  if (block.type === "profile_card") {
    const name = block.props?.name || "Nombre del perfil";
    const role = block.props?.role || "Rol";
    const email = block.props?.email || "correo@empresa.com";
    const initials = name.split(" ").filter(Boolean).slice(0, 2)
      .map((p) => p[0]?.toUpperCase() || "").join("");
    return `<article data-profile-card name="${escapeHtml(name)}" role="${escapeHtml(role)}" email="${escapeHtml(email)}" class="profile-card-block"><div class="profile-avatar-block">${escapeHtml(initials || "NP")}</div><div class="profile-copy-block"><h3>${escapeHtml(name)}</h3><p class="profile-role-block">${escapeHtml(role)}</p><p>${escapeHtml(email)}</p></div></article>`;
  }

  if (block.type === "mermaid") {
    return `<div data-mermaid-block title="${escapeHtml(block.props?.title || "Diagrama")}" code="${escapeHtml(block.content || "")}" class="mermaid-embed-block"><div class="mermaid-embed-label">${escapeHtml(block.props?.title || "Diagrama")}</div><pre class="mermaid-embed-code">${escapeHtml(block.content || "")}</pre></div>`;
  }

  if (block.type === "table") {
    const columns = block.props?.columns || [];
    const rows = block.props?.rows || [];
    return `<table><thead><tr>${columns.map((col) => `<th>${escapeHtml(col)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) =>
      `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`
    ).join("")}</tbody></table>`;
  }

  // Unknown block type — render as paragraph
  return `<p>${richContent}</p>`;
};

// ─── pageDocumentToHtml ───────────────────────────────────────────────────────

export const pageDocumentToHtml = (document) =>
  (document?.blocks || []).map((block) => blockToHtml(block)).join("");

// ─── htmlToPageDocument ───────────────────────────────────────────────────────

const normalizeListItems = (nodeList) =>
  Array.from(nodeList)
    .map((li) => {
      const inner = li.innerHTML?.trim() || "";
      const text = li.textContent?.trim() || "";
      // Strip wrapping <p> added by Tiptap: <li><p>content</p></li>
      const unwrapped = inner.replace(/^<p>([\s\S]*?)<\/p>$/i, "$1");
      return { text, html: unwrapped !== text ? unwrapped : undefined };
    })
    .filter((item) => item.text);

export const htmlToPageDocument = (html, previousDocument = {}) => {
  const parser = new DOMParser();
  const parsed = parser.parseFromString(html || "<p></p>", "text/html");
  const nodes = Array.from(parsed.body.children);
  const blocks = [];

  nodes.forEach((node) => {
    const tag = node.tagName.toLowerCase();

    // Skip truly empty paragraphs
    if (tag === "p" && !node.textContent?.trim() && !node.innerHTML?.trim()) return;

    // ── Headings ──
    if (tag === "h1" || tag === "h2" || tag === "h3" || tag === "h4") {
      const level = Number(tag.replace("h", ""));
      const content = node.textContent?.trim() || "";
      const innerHTML = node.innerHTML?.trim() || "";
      const block = {
        id: createBlockId(),
        type: "heading",
        props: { level },
        content, // plain text used for meta.title
      };
      // Store rich HTML only when it differs from plain text (has marks)
      if (innerHTML !== escapeHtml(content) && innerHTML !== content) {
        block.html = innerHTML;
      }
      blocks.push(block);
      return;
    }

    // ── Task list ──
    if (tag === "ul" && node.getAttribute("data-type") === "taskList") {
      const items = Array.from(node.querySelectorAll('li[data-type="taskItem"]')).map((li) => {
        const divEl = li.querySelector("div");
        const pEl = divEl?.querySelector("p") || divEl;
        const text = pEl?.textContent?.trim() || li.textContent?.trim() || "";
        const innerHTML = pEl?.innerHTML?.trim() || "";
        return {
          label: text,
          checked: li.getAttribute("data-checked") === "true",
          ...(innerHTML !== escapeHtml(text) && innerHTML !== text ? { html: innerHTML } : {}),
        };
      });
      blocks.push({ id: createBlockId(), type: "task_list", content: items });
      return;
    }

    // ── Bullet list ──
    if (tag === "ul") {
      const items = normalizeListItems(node.querySelectorAll(":scope > li"));
      blocks.push({
        id: createBlockId(),
        type: "bullet_list",
        // Legacy-compatible: array of strings when no rich text, objects when rich
        content: items.every((i) => !i.html) ? items.map((i) => i.text) : items,
      });
      return;
    }

    // ── Ordered list ──
    if (tag === "ol") {
      const items = normalizeListItems(node.querySelectorAll(":scope > li"));
      blocks.push({
        id: createBlockId(),
        type: "ordered_list",
        content: items.every((i) => !i.html) ? items.map((i) => i.text) : items,
      });
      return;
    }

    // ── Blockquote ──
    if (tag === "blockquote") {
      const content = node.textContent?.trim() || "";
      const innerHTML = node.innerHTML?.trim() || "";
      const block = { id: createBlockId(), type: "quote", content };
      if (innerHTML !== escapeHtml(content) && innerHTML !== content) block.html = innerHTML;
      blocks.push(block);
      return;
    }

    // ── Callout ──
    if (tag === "div" && node.hasAttribute("data-callout-block")) {
      blocks.push({
        id: createBlockId(),
        type: "callout",
        props: { tone: node.getAttribute("tone") || "info" },
        content: node.textContent?.trim() || "",
      });
      return;
    }

    // ── Divider ──
    if (tag === "hr") {
      blocks.push({ id: createBlockId(), type: "divider" });
      return;
    }

    // ── Code block ──
    if (tag === "pre") {
      blocks.push({
        id: createBlockId(),
        type: "code_block",
        props: { language: "" },
        content: node.textContent || "",
      });
      return;
    }

    // ── Profile card ──
    if (tag === "article" && node.hasAttribute("data-profile-card")) {
      blocks.push({
        id: createBlockId(),
        type: "profile_card",
        props: {
          name: node.getAttribute("name") || "Nombre del perfil",
          role: node.getAttribute("role") || "Rol",
          email: node.getAttribute("email") || "correo@empresa.com",
          avatar: "",
        },
      });
      return;
    }

    // ── Mermaid ──
    if (tag === "div" && node.hasAttribute("data-mermaid-block")) {
      blocks.push({
        id: createBlockId(),
        type: "mermaid",
        props: { title: node.getAttribute("title") || "Diagrama" },
        content: node.getAttribute("code") || node.textContent || "",
      });
      return;
    }

    // ── Table ──
    // Tiptap renders all rows in tbody; first row uses <th> when it's a header
    if (tag === "table") {
      const allRows = Array.from(node.querySelectorAll("tr"));
      if (allRows.length === 0) return;
      const firstRow = allRows[0];
      const isHeaderRow = firstRow.querySelector("th") !== null;
      const columns = Array.from(firstRow.querySelectorAll("th, td"))
        .map((c) => c.textContent?.trim() || "");
      const dataRows = (isHeaderRow ? allRows.slice(1) : allRows).map((row) =>
        Array.from(row.querySelectorAll("td, th")).map((c) => c.textContent?.trim() || "")
      );
      blocks.push({ id: createBlockId(), type: "table", props: { columns, rows: dataRows } });
      return;
    }

    // ── Paragraph (default) — preserve rich HTML ──
    const content = node.textContent?.trim() || "";
    const innerHTML = node.innerHTML?.trim() || "";
    const block = { id: createBlockId(), type: "paragraph", content };
    if (innerHTML !== escapeHtml(content) && innerHTML !== content) {
      block.html = innerHTML;
    }
    blocks.push(block);
  });

  const firstHeading = blocks.find((b) => b.type === "heading");
  const title = firstHeading?.content || previousDocument?.meta?.title || "Sin título";

  return {
    ...previousDocument,
    meta: { ...previousDocument?.meta, title },
    blocks: blocks.length > 0 ? blocks : [{ id: createBlockId(), type: "paragraph", content: "" }],
    document_version: previousDocument?.document_version || 1,
  };
};
