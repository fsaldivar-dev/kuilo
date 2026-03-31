/**
 * API Endpoint block — visual card for documenting REST endpoints.
 * Complex attrs (params, responses) stored as JSON strings internally.
 */

import { Node, mergeAttributes } from "@tiptap/core";

export const ApiEndpoint = Node.create({
  name: "apiEndpoint",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      method:      { default: "GET" },
      path:        { default: "/api/" },
      description: { default: "" },
      auth:        { default: "" },
      requestBody: { default: "" },
      // Complex attrs stored as JSON strings
      params:      { default: "[]" },
      responses:   { default: '[{"status":"200","description":"OK","body":""}]' },
    };
  },

  parseHTML() {
    return [{
      tag: 'div[data-type="api-endpoint"]',
      getAttrs: (el) => {
        try {
          const raw = JSON.parse(el.getAttribute("data-attrs") || "{}");
          return {
            ...raw,
            params: typeof raw.params === "string" ? raw.params : JSON.stringify(raw.params || []),
            responses: typeof raw.responses === "string" ? raw.responses : JSON.stringify(raw.responses || []),
          };
        } catch { return {}; }
      },
    }];
  },

  renderHTML({ node, HTMLAttributes }) {
    const attrs = { ...node.attrs };
    return ["div", mergeAttributes(HTMLAttributes, {
      "data-type": "api-endpoint",
      "data-attrs": JSON.stringify(attrs),
    })];
  },

  addCommands() {
    return {
      insertApiEndpoint: (attrs = {}) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: {
            method: attrs.method || "GET",
            path: attrs.path || "/api/",
            description: attrs.description || "",
            auth: attrs.auth || "Bearer {token}",
            requestBody: attrs.requestBody || "",
            params: typeof attrs.params === "string" ? attrs.params : JSON.stringify(attrs.params || []),
            responses: typeof attrs.responses === "string" ? attrs.responses : JSON.stringify(attrs.responses || [{ status: "200", description: "OK", body: '{\n  \n}' }]),
          },
        });
      },
    };
  },
});
