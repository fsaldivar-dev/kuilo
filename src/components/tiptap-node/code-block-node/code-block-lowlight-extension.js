/**
 * Code block con syntax highlighting via lowlight.
 * Reemplaza el CodeBlock de StarterKit.
 */

import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
import { createLowlight } from "lowlight";

// Lenguajes comunes — importación selectiva para mantener el bundle pequeño
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import python from "highlight.js/lib/languages/python";
import bash from "highlight.js/lib/languages/bash";
import css from "highlight.js/lib/languages/css";
import html from "highlight.js/lib/languages/xml";     // xml cubre HTML
import json from "highlight.js/lib/languages/json";
import sql from "highlight.js/lib/languages/sql";
import rust from "highlight.js/lib/languages/rust";
import go from "highlight.js/lib/languages/go";
import java from "highlight.js/lib/languages/java";
import cpp from "highlight.js/lib/languages/cpp";
import kotlin from "highlight.js/lib/languages/kotlin";
import swift from "highlight.js/lib/languages/swift";
import dart from "highlight.js/lib/languages/dart";
import gradle from "highlight.js/lib/languages/gradle";
import groovy from "highlight.js/lib/languages/groovy";
import markdown from "highlight.js/lib/languages/markdown";
import yaml from "highlight.js/lib/languages/yaml";
import dockerfile from "highlight.js/lib/languages/dockerfile";

const lowlight = createLowlight();

lowlight.register("javascript", javascript);
lowlight.register("js", javascript);
lowlight.register("typescript", typescript);
lowlight.register("ts", typescript);
lowlight.register("python", python);
lowlight.register("py", python);
lowlight.register("bash", bash);
lowlight.register("sh", bash);
lowlight.register("shell", bash);
lowlight.register("css", css);
lowlight.register("html", html);
lowlight.register("xml", html);
lowlight.register("json", json);
lowlight.register("sql", sql);
lowlight.register("rust", rust);
lowlight.register("rs", rust);
lowlight.register("go", go);
lowlight.register("java", java);
lowlight.register("cpp", cpp);
lowlight.register("c++", cpp);
lowlight.register("kotlin", kotlin);
lowlight.register("kt", kotlin);
lowlight.register("kts", kotlin);
lowlight.register("swift", swift);
lowlight.register("dart", dart);
lowlight.register("gradle", gradle);
lowlight.register("groovy", groovy);
lowlight.register("markdown", markdown);
lowlight.register("md", markdown);
lowlight.register("yaml", yaml);
lowlight.register("yml", yaml);
lowlight.register("dockerfile", dockerfile);

export const SUPPORTED_LANGUAGES = [
  { label: "Plain text",   value: "" },
  { label: "Mermaid",      value: "mermaid" },
  // — Mobile / Android / iOS —
  { label: "Kotlin",       value: "kotlin" },
  { label: "Swift",        value: "swift" },
  { label: "Dart",         value: "dart" },
  { label: "Gradle",       value: "gradle" },
  { label: "Groovy",       value: "groovy" },
  // — Web —
  { label: "JavaScript",   value: "javascript" },
  { label: "TypeScript",   value: "typescript" },
  { label: "CSS",          value: "css" },
  { label: "HTML",         value: "html" },
  // — Backend —
  { label: "Java",         value: "java" },
  { label: "Python",       value: "python" },
  { label: "Go",           value: "go" },
  { label: "Rust",         value: "rust" },
  { label: "C++",          value: "cpp" },
  // — Data / Infra —
  { label: "SQL",          value: "sql" },
  { label: "JSON",         value: "json" },
  { label: "YAML",         value: "yaml" },
  { label: "Bash / Shell", value: "bash" },
  { label: "Dockerfile",   value: "dockerfile" },
  { label: "Markdown",     value: "markdown" },
];

export const CodeBlockWithHighlight = CodeBlockLowlight.configure({
  lowlight,
  defaultLanguage: null,
  HTMLAttributes: { class: "code-block-highlight" },
});
