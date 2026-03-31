/**
 * Chart block — embeds Recharts inside the editor.
 * Supports bar, line, area, and pie charts.
 * Data stored as JSON string in attrs.
 */

import { Node, mergeAttributes } from "@tiptap/core";

export const ChartBlock = Node.create({
  name: "chartBlock",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      chartType: { default: "bar" },
      title:     { default: "" },
      data:      { default: '[{"name":"Ene","value":0},{"name":"Feb","value":0},{"name":"Mar","value":0}]' },
      xKey:      { default: "name" },
      yKey:      { default: "value" },
      color:     { default: "#0071e3" },
    };
  },

  parseHTML() {
    return [{
      tag: 'div[data-type="chart-block"]',
      getAttrs: (el) => {
        try { return JSON.parse(el.getAttribute("data-attrs") || "{}"); }
        catch { return {}; }
      },
    }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, {
      "data-type": "chart-block",
      "data-attrs": JSON.stringify(node.attrs),
    })];
  },

  addCommands() {
    return {
      insertChart: (attrs = {}) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: {
            chartType: attrs.chartType || "bar",
            title: attrs.title || "",
            data: attrs.data || '[{"name":"Ene","value":10},{"name":"Feb","value":25},{"name":"Mar","value":18},{"name":"Abr","value":30}]',
            xKey: attrs.xKey || "name",
            yKey: attrs.yKey || "value",
            color: attrs.color || "#0071e3",
          },
        });
      },
    };
  },
});
