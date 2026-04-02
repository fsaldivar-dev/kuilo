const { app, BrowserWindow, ipcMain, shell, dialog } = require("electron");
const path = require("path");
const fs = require("fs/promises");
const os = require("os");

// ─── Safe IPC handler wrapper ────────────────────────────────────────────────
// Wraps every handler in try/catch so unhandled errors never crash the app.

function safeHandle(channel, handler) {
  ipcMain.handle(channel, async (...args) => {
    try {
      return await handler(...args);
    } catch (err) {
      console.error(`[IPC] ${channel} error:`, err.message);
      return { error: err.message };
    }
  });
}

const ROOT_PACKAGE_ID = "__root__";
const ROOT_PACKAGE_LABEL = "docs";
// Directorios que nunca deben indexarse como documentos
const RESERVED_DOC_DIRS = new Set([
  "assets", "versions", "legacy",
  "node_modules", "dist", "build", "out", ".git", ".next",
  "src", "scripts", "gradle", ".gradle", "coverage", ".cache",
]);

// ─── Settings (vault path persistente) ───────────────────────────────────────

const getSettingsPath = () => path.join(app.getPath("userData"), "settings.json");

const readSettings = async () => {
  try {
    const raw = await fs.readFile(getSettingsPath(), "utf8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

const writeSettings = async (settings) => {
  await fs.writeFile(getSettingsPath(), JSON.stringify(settings, null, 2), "utf8");
};

// ─── Vault root dinámico ──────────────────────────────────────────────────────

const getDefaultDocsRoot = () => path.join(__dirname, "..", "docs");

let _vaultPath = null; // cache en memoria

const getVaultRoot = async () => {
  if (_vaultPath) return _vaultPath;
  const settings = await readSettings();
  _vaultPath = settings.vaultPath || getDefaultDocsRoot();
  return _vaultPath;
};

const setVaultRoot = async (newPath) => {
  _vaultPath = newPath;
  const settings = await readSettings();
  await writeSettings({ ...settings, vaultPath: newPath });
};

const ensureVaultRoot = async () => {
  const root = await getVaultRoot();
  await fs.mkdir(root, { recursive: true });
  return root;
};

const slugify = (value, fallback = "sin-titulo") =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || fallback;

const stripMarkdown = (value = "") =>
  value
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/[*_>#-]/g, "")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .trim();

const getTitleFromHtml = (html = "") => {
  const match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
  if (!match) return "Nuevo documento";
  return match[1]
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim() || "Nuevo documento";
};

const getTitleFromMarkdown = (content = "") => {
  const heading = content.match(/^#\s+(.+)$/m);
  if (heading) return heading[1].trim();
  const firstLine = content
    .split("\n")
    .map((line) => stripMarkdown(line))
    .find(Boolean);
  return firstLine || "Nuevo documento";
};

const htmlToMarkdown = (html = "") => {
  let markdown = html;
  markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, (_, text) => `# ${text.replace(/<[^>]+>/g, "").trim()}\n\n`);
  markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, (_, text) => `## ${text.replace(/<[^>]+>/g, "").trim()}\n\n`);
  markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, (_, text) => `### ${text.replace(/<[^>]+>/g, "").trim()}\n\n`);
  markdown = markdown.replace(/<p[^>]*><br\s*\/?><\/p>/gi, "\n\n");
  markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gi, (_, text) => `${text.replace(/<[^>]+>/g, "").trim()}\n\n`);
  markdown = markdown.replace(/<pre[^>]*class="mermaid"[^>]*>([\s\S]*?)<\/pre>/gi, (_, code) => {
    return `\`\`\`mermaid\n${code.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").trim()}\n\`\`\`\n\n`;
  });
  markdown = markdown.replace(/<[^>]+>/g, "");
  markdown = markdown.replace(/\n{3,}/g, "\n\n");
  return markdown.trim() || "# Nuevo documento";
};

const pathExists = async (targetPath) => {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
};

const readJson = async (filePath) => JSON.parse(await fs.readFile(filePath, "utf8"));

const getVersionsDirFromPagePath = (packageDir, pagePath) =>
  path.join(path.dirname(path.join(packageDir, pagePath)), "versions");

const buildSnapshotMetadata = (document, fileName, savedAt) => ({
  id: fileName.replace(/\.json$/i, ""),
  fileName,
  savedAt,
  title: document?.meta?.title || "Sin título",
  version: document?.document_version || 1,
});

const listVersionEntries = async (versionsDir) => {
  if (!(await pathExists(versionsDir))) return [];
  const entries = await fs.readdir(versionsDir, { withFileTypes: true });
  const versions = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
    const versionPath = path.join(versionsDir, entry.name);
    const snapshot = await readJson(versionPath);
    const savedAt = snapshot.saved_at || snapshot.document?.meta?.updated_at || null;
    versions.push(buildSnapshotMetadata(snapshot.document, entry.name, savedAt));
  }

  return versions.sort((a, b) => (b.savedAt || "").localeCompare(a.savedAt || ""));
};

const snapshotCurrentDocument = async (versionsDir, document) => {
  await fs.mkdir(versionsDir, { recursive: true });
  const savedAt = new Date().toISOString();
  const versionLabel = String(document?.document_version || 1).padStart(4, "0");
  const fileName = `${savedAt.replace(/[:.]/g, "-")}-v${versionLabel}.json`;
  const snapshot = {
    saved_at: savedAt,
    document,
  };
  await fs.writeFile(path.join(versionsDir, fileName), JSON.stringify(snapshot, null, 2), "utf8");
  return buildSnapshotMetadata(document, fileName, savedAt);
};

const getPackageDir = async (packageName) => {
  const root = await getVaultRoot();
  if (packageName === ROOT_PACKAGE_ID) return root;
  // Previene path traversal
  const safe = packageName.replace(/\.\./g, "").replace(/^\//, "");
  const resolved = path.join(root, safe);
  return resolved.startsWith(root) ? resolved : root;
};

const createDocumentNode = (packageName, pagePath, title, children = [], sourceType = "legacy-markdown") => ({
  id: `${packageName}/${pagePath}`,
  packageName,
  pagePath,
  title,
  children,
  sourceType,
});

const buildPageNodeFromFile = async (packageName, directoryPath, relativeDirectory, fileName) => {
  const filePath = path.join(directoryPath, fileName);
  const content = await fs.readFile(filePath, "utf8");
  const relativePath = relativeDirectory ? `${relativeDirectory}/${fileName}` : fileName;
  return createDocumentNode(
    packageName,
    relativePath,
    fileName.endsWith(".md") ? getTitleFromMarkdown(content) : getTitleFromHtml(content),
    [],
    "legacy-markdown"
  );
};

const listPagesRecursive = async (packageName, directoryPath, relativeDirectory = "") => {
  const entries = await fs.readdir(directoryPath, { withFileTypes: true });
  const nodes = [];

  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name, "es-MX"))) {
    const relativePath = relativeDirectory ? `${relativeDirectory}/${entry.name}` : entry.name;

    if (entry.isFile() && (entry.name.endsWith(".md") || entry.name.endsWith(".html"))) {
      nodes.push(await buildPageNodeFromFile(packageName, directoryPath, relativeDirectory, entry.name));
      continue;
    }

    if (!entry.isDirectory()) continue;
    if (RESERVED_DOC_DIRS.has(entry.name)) continue;
    if (entry.name.startsWith(".") || entry.name.startsWith("_")) continue;

    const dirPath = path.join(directoryPath, entry.name);
    const pageJsonPath = path.join(dirPath, "page.json");
    if (await pathExists(pageJsonPath)) {
      const pageDoc = await readJson(pageJsonPath);
      const childNodes = await listPagesRecursive(packageName, dirPath, relativePath);
      nodes.push(
        createDocumentNode(
          packageName,
          `${relativePath}/page.json`,
          pageDoc.meta?.title || entry.name,
          childNodes,
          "page-json"
        )
      );
      continue;
    }

    const nestedNodes = await listPagesRecursive(packageName, dirPath, relativePath);
    nodes.push(...nestedNodes);
  }

  return nodes;
};

const listPackages = async () => {
  const root = await ensureVaultRoot();
  const entries = await fs.readdir(root, { withFileTypes: true });
  const packages = [];
  const rootFiles = entries.filter(
    (entry) => entry.isFile() && (entry.name.endsWith(".md") || entry.name.endsWith(".html"))
  );
  const rootStructuredDocs = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (RESERVED_DOC_DIRS.has(entry.name) || entry.name.startsWith("_")) continue;
    const pageJsonPath = path.join(root, entry.name, "page.json");
    if (await pathExists(pageJsonPath)) rootStructuredDocs.push(entry);
  }

  if (rootFiles.length > 0 || rootStructuredDocs.length > 0) {
    packages.push({
      id: ROOT_PACKAGE_ID,
      name: ROOT_PACKAGE_LABEL,
      pages: await listPagesRecursive(ROOT_PACKAGE_ID, root),
    });
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith("_") || entry.name.startsWith(".")) continue;
    if (RESERVED_DOC_DIRS.has(entry.name)) continue;
    const pageJsonPath = path.join(root, entry.name, "page.json");
    if (await pathExists(pageJsonPath)) continue;

    const packageDir = path.join(root, entry.name);
    const pages = await listPagesRecursive(entry.name, packageDir);
    // Solo incluir el package si tiene documentos (.md / page.json)
    if (pages.length === 0) continue;
    packages.push({
      id: entry.name,
      name: entry.name,
      pages,
    });
  }

  packages.sort((a, b) => {
    if (a.id === ROOT_PACKAGE_ID) return -1;
    if (b.id === ROOT_PACKAGE_ID) return 1;
    return a.name.localeCompare(b.name, "es-MX");
  });
  return packages;
};

const createWindow = async () => {
  await ensureVaultRoot();

  // Set app name for macOS menu bar and About dialog
  app.setName("Kuilo");

  const win = new BrowserWindow({
    title: "Kuilo",
    width: 1440,
    height: 960,
    minWidth: 1000,
    minHeight: 680,
    frame: false,
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 14, y: 18 },
    transparent: false,
    backgroundColor: "#1c1c1e",
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, "preload.cjs"),
    },
  });

  await win.loadFile(path.join(__dirname, "..", "dist", "index.html"));
};

const buildUniquePagePath = async (packageDir, title, parentPath = null) => {
  const parentDirectory = parentPath
    ? path.dirname(path.join(packageDir, parentPath))
    : packageDir;
  const baseName = slugify(title, "nuevo-documento");
  let attempt = 0;

  while (true) {
    const suffix = attempt === 0 ? "" : `-${attempt + 1}`;
    const dirName = `${baseName}${suffix}`;
    const targetDir = path.join(parentDirectory, dirName);
    if (!(await pathExists(targetDir))) {
      return path.relative(packageDir, path.join(targetDir, "page.json")).replace(/\\/g, "/");
    }
    attempt += 1;
  }
};

safeHandle("notes:list-tree", async () => listPackages());

safeHandle("notes:open-docs-folder", async () => {
  const root = await getVaultRoot();
  const result = await shell.openPath(root);
  return { ok: result === "", path: root, error: result || null };
});

safeHandle("notes:get-vault", async () => {
  const vaultPath = await getVaultRoot();
  const isDefault = vaultPath === getDefaultDocsRoot();
  return { vaultPath, isDefault };
});

safeHandle("notes:open-vault-dialog", async () => {
  const result = await dialog.showOpenDialog({
    title: "Seleccionar carpeta vault",
    properties: ["openDirectory"],
    buttonLabel: "Usar como vault",
  });

  if (result.canceled || !result.filePaths[0]) {
    return { changed: false };
  }

  const newPath = result.filePaths[0];
  await setVaultRoot(newPath);
  return { changed: true, vaultPath: newPath };
});

safeHandle("notes:choose-or-create-folder", async () => {
  // macOS showOpenDialog with createDirectory allows creating new folders in the dialog
  const result = await dialog.showOpenDialog({
    title: "Elegir o crear carpeta para el proyecto",
    properties: ["openDirectory", "createDirectory"],
    buttonLabel: "Usar esta carpeta",
    message: "Selecciona una carpeta existente o crea una nueva",
  });

  if (result.canceled || !result.filePaths[0]) return { path: null };

  const chosen = result.filePaths[0];
  await fs.mkdir(chosen, { recursive: true });
  await setVaultRoot(chosen);
  return { path: chosen };
});

safeHandle("notes:reset-vault", async () => {
  const defaultPath = getDefaultDocsRoot();
  await setVaultRoot(defaultPath);
  return { vaultPath: defaultPath };
});

safeHandle("notes:read-doc", async (_, payload) => {
  const packageDir = await getPackageDir(payload.packageName);
  const filePath = path.join(packageDir, payload.pagePath);

  if (payload.pagePath.endsWith("page.json")) {
    const document = await readJson(filePath);
    return {
      title: document.meta?.title || path.basename(path.dirname(filePath)),
      sourceType: "page-json",
      document,
    };
  }

  const content = await fs.readFile(filePath, "utf8");
  if (payload.pagePath.endsWith(".md")) {
    return { content, title: getTitleFromMarkdown(content), sourceType: "legacy-markdown" };
  }
  const markdown = htmlToMarkdown(content);
  return { content: markdown, title: getTitleFromMarkdown(markdown), sourceType: "legacy-markdown" };
});

safeHandle("notes:list-doc-versions", async (_, payload) => {
  const packageDir = await getPackageDir(payload.packageName);
  const versionsDir = getVersionsDirFromPagePath(packageDir, payload.pagePath);
  return listVersionEntries(versionsDir);
});

safeHandle("notes:read-doc-version", async (_, payload) => {
  const packageDir = await getPackageDir(payload.packageName);
  const versionsDir = getVersionsDirFromPagePath(packageDir, payload.pagePath);
  const versionPath = path.join(versionsDir, payload.versionFileName);
  const snapshot = await readJson(versionPath);
  return { document: snapshot.document, savedAt: snapshot.savedAt };
});

safeHandle("notes:create-package", async (_, payload) => {
  const root = await ensureVaultRoot();
  const baseName = slugify(payload.name, "paquete");
  let packageName = baseName;
  let attempt = 2;

  while (await pathExists(path.join(root, packageName))) {
    packageName = `${baseName}-${attempt}`;
    attempt += 1;
  }

  await fs.mkdir(path.join(root, packageName), { recursive: true });
  return { id: packageName, name: packageName, pages: [] };
});

safeHandle("notes:create-doc", async (_, payload) => {
  const packageDir = await getPackageDir(payload.packageName);
  await fs.mkdir(packageDir, { recursive: true });

  const title = payload.title?.trim() || "Nueva página";
  const pagePath = await buildUniquePagePath(packageDir, title, payload.parentPath || null);
  const docDir = path.dirname(path.join(packageDir, pagePath));
  const initialDocument = {
    meta: {
      doc_id: slugify(title, "nuevo-documento"),
      doc_type: "spec",
      title,
      status: "draft",
      owner: "owner",
      tags: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: "0.1.0",
    },
    blocks: [
      { id: "blk-heading-1", type: "heading", props: { level: 1 }, content: "Resumen" },
      { id: "blk-paragraph-1", type: "paragraph", content: "" },
    ],
    relations: {
      links_to: [],
      linked_from: [],
    },
    document_version: 1,
  };

  await fs.mkdir(path.join(docDir, "versions"), { recursive: true });
  await fs.mkdir(path.join(docDir, "assets"), { recursive: true });
  await fs.writeFile(path.join(docDir, "page.json"), JSON.stringify(initialDocument, null, 2), "utf8");

  return { packageName: payload.packageName, pagePath, title, sourceType: "page-json", document: initialDocument };
});

safeHandle("notes:save-doc", async (_, payload) => {
  // Schedule auto-backup after save completes (defined below)
  if (typeof scheduleAutoBackup === "function") setTimeout(scheduleAutoBackup, 100);
  const packageDir = await getPackageDir(payload.packageName);

  if (payload.sourceType === "page-json" || payload.pagePath.endsWith("page.json")) {
    const filePath = path.join(packageDir, payload.pagePath);
    const versionsDir = getVersionsDirFromPagePath(packageDir, payload.pagePath);
    const existingDocument = (await pathExists(filePath)) ? await readJson(filePath) : null;
    const now = new Date().toISOString();
    const didChange =
      !existingDocument || JSON.stringify(existingDocument.blocks || []) !== JSON.stringify(payload.document.blocks || []);

    if (existingDocument && didChange) {
      await snapshotCurrentDocument(versionsDir, existingDocument);
    }

    const document = {
      ...payload.document,
      meta: {
        ...payload.document.meta,
        updated_at: now,
        created_at: payload.document.meta?.created_at || existingDocument?.meta?.created_at || now,
      },
      document_version: didChange
        ? Math.max(existingDocument?.document_version || 0, payload.document.document_version || 0) + 1
        : existingDocument?.document_version || payload.document.document_version || 1,
    };
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(document, null, 2), "utf8");
    return {
      packageName: payload.packageName,
      pagePath: payload.pagePath,
      title: document.meta?.title || "Sin título",
      sourceType: "page-json",
      document,
      versions: await listVersionEntries(versionsDir),
    };
  }

  const nextPagePath = payload.pagePath.replace(/\.html$/i, ".md");
  const filePath = path.join(packageDir, nextPagePath);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, payload.content, "utf8");

  if (nextPagePath !== payload.pagePath) {
    const legacyPath = path.join(packageDir, payload.pagePath);
    try {
      await fs.unlink(legacyPath);
    } catch {}
  }

  return {
    packageName: payload.packageName,
    pagePath: nextPagePath,
    title: getTitleFromMarkdown(payload.content),
    sourceType: "legacy-markdown",
  };
});

safeHandle("notes:restore-doc-version", async (_, payload) => {
  const packageDir = await getPackageDir(payload.packageName);
  const filePath = path.join(packageDir, payload.pagePath);
  const versionsDir = getVersionsDirFromPagePath(packageDir, payload.pagePath);
  const versionPath = path.join(versionsDir, payload.versionFileName);
  const currentDocument = await readJson(filePath);
  const snapshot = await readJson(versionPath);
  const restoredBase = snapshot.document;
  const restoredDocument = {
    ...restoredBase,
    meta: {
      ...restoredBase.meta,
      updated_at: new Date().toISOString(),
    },
    document_version: Math.max(currentDocument?.document_version || 0, restoredBase?.document_version || 0) + 1,
  };

  await snapshotCurrentDocument(versionsDir, currentDocument);
  await fs.writeFile(filePath, JSON.stringify(restoredDocument, null, 2), "utf8");

  return {
    packageName: payload.packageName,
    pagePath: payload.pagePath,
    title: restoredDocument.meta?.title || "Sin título",
    sourceType: "page-json",
    document: restoredDocument,
    versions: await listVersionEntries(versionsDir),
  };
});

safeHandle("notes:promote-doc", async (_, payload) => {
  // payload: { packageName, pagePath (.md), document (page.json blocks), title }
  const packageDir = await getPackageDir(payload.packageName);

  // Derive folder name from .md filename (strip extension)
  const mdBaseName = path.basename(payload.pagePath, path.extname(payload.pagePath));
  const mdParentDir = path.dirname(payload.pagePath);
  const folderRelPath = mdParentDir === "." ? mdBaseName : `${mdParentDir}/${mdBaseName}`;
  const docDir = path.join(packageDir, folderRelPath);
  const newPagePath = `${folderRelPath}/page.json`;

  // Create folder structure
  await fs.mkdir(path.join(docDir, "versions"), { recursive: true });
  await fs.mkdir(path.join(docDir, "assets"), { recursive: true });

  const now = new Date().toISOString();
  const document = {
    ...payload.document,
    meta: {
      ...payload.document.meta,
      title: payload.title || payload.document.meta?.title || "Sin título",
      created_at: now,
      updated_at: now,
    },
    document_version: 1,
  };

  await fs.writeFile(path.join(docDir, "page.json"), JSON.stringify(document, null, 2), "utf8");

  // The original .md is intentionally left in place.
  // Other tools (Obsidian, VS Code, etc.) may still reference it.
  // The user can delete it manually if they no longer need it.

  return {
    packageName: payload.packageName,
    pagePath: newPagePath,
    title: document.meta.title,
    sourceType: "page-json",
    document,
    versions: [],
  };
});

// ─── Delete document ─────────────────────────────────────────────────────────

safeHandle("notes:delete-doc", async (_, payload) => {
  const packageDir = await getPackageDir(payload.packageName);
  const fullPath = path.join(packageDir, payload.pagePath);

  if (payload.pagePath.endsWith("page.json")) {
    // Structured doc — delete the entire folder (page.json + versions/ + assets/)
    const docDir = path.dirname(fullPath);
    await fs.rm(docDir, { recursive: true, force: true });
  } else {
    // Legacy .md — delete the single file
    await fs.unlink(fullPath).catch(() => {});
  }

  return { ok: true };
});

// ─── Rename document ─────────────────────────────────────────────────────────

safeHandle("notes:rename-doc", async (_, payload) => {
  const packageDir = await getPackageDir(payload.packageName);
  const fullPath = path.join(packageDir, payload.pagePath);

  if (payload.pagePath.endsWith("page.json")) {
    // Update title in page.json meta
    const doc = await readJson(fullPath);
    doc.meta = { ...doc.meta, title: payload.title, updated_at: new Date().toISOString() };
    await fs.writeFile(fullPath, JSON.stringify(doc, null, 2), "utf8");
    return { ok: true, title: payload.title, document: doc };
  }

  // Legacy .md — can't rename file easily (would break paths), just update content heading
  return { ok: true, title: payload.title };
});

// ─── Search content ──────────────────────────────────────────────────────────

safeHandle("notes:search-content", async (_, { query }) => {
  const root = await getVaultRoot();
  const q = (query || "").trim().toLowerCase();
  if (!q) return [];

  const results = [];

  const searchDir = async (dir, packageName) => {
    let entries;
    try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return; }

    for (const entry of entries) {
      if (entry.name.startsWith(".") || entry.name.startsWith("_")) continue;
      if (RESERVED_DOC_DIRS.has(entry.name)) continue;
      const fullPath = path.join(dir, entry.name);

      if (entry.isFile() && entry.name.endsWith(".md")) {
        const content = await fs.readFile(fullPath, "utf8");
        const title = getTitleFromMarkdown(content);
        if (title.toLowerCase().includes(q) || content.toLowerCase().includes(q)) {
          const idx = content.toLowerCase().indexOf(q);
          results.push({
            packageName,
            pagePath: path.relative(path.join(root, packageName === ROOT_PACKAGE_ID ? "" : packageName), fullPath),
            title,
            sourceType: "legacy-markdown",
            snippet: idx >= 0 ? content.slice(Math.max(0, idx - 40), idx + 120).trim() : content.slice(0, 120),
          });
        }
      } else if (entry.isDirectory()) {
        const pjPath = path.join(fullPath, "page.json");
        if (await pathExists(pjPath)) {
          const doc = await readJson(pjPath);
          const title = doc.meta?.title || entry.name;
          const text = (doc.blocks || []).map(b => typeof b.content === "string" ? b.content : Array.isArray(b.content) ? b.content.map(n => n.text || "").join("") : "").join(" ");
          if (title.toLowerCase().includes(q) || text.toLowerCase().includes(q)) {
            const idx = text.toLowerCase().indexOf(q);
            results.push({
              packageName,
              pagePath: path.relative(path.join(root, packageName === ROOT_PACKAGE_ID ? "" : packageName), pjPath),
              title,
              sourceType: "page-json",
              snippet: idx >= 0 ? text.slice(Math.max(0, idx - 40), idx + 120).trim() : text.slice(0, 120),
            });
          }
        }
        await searchDir(fullPath, packageName);
      }
    }
  };

  const entries = await fs.readdir(root, { withFileTypes: true });
  // Root-level files
  for (const e of entries.filter(e => e.isFile() && e.name.endsWith(".md"))) {
    const content = await fs.readFile(path.join(root, e.name), "utf8");
    const title = getTitleFromMarkdown(content);
    if (title.toLowerCase().includes(q) || content.toLowerCase().includes(q)) {
      const idx = content.toLowerCase().indexOf(q);
      results.push({ packageName: ROOT_PACKAGE_ID, pagePath: e.name, title, sourceType: "legacy-markdown",
        snippet: idx >= 0 ? content.slice(Math.max(0, idx - 40), idx + 120).trim() : content.slice(0, 120) });
    }
  }
  // Packages
  for (const e of entries.filter(e => e.isDirectory() && !e.name.startsWith(".") && !RESERVED_DOC_DIRS.has(e.name))) {
    await searchDir(path.join(root, e.name), e.name);
  }

  return results;
});

// ─── AI Chat ─────────────────────────────────────────────────────────────────

safeHandle("notes:ai-chat", async (_, { messages, provider, apiKey, vaultContext }) => {
  if (!apiKey) return { error: "API key requerida. Configúrala en Conectores AI." };

  const systemPrompt = `Eres el asistente de documentación de Kuilo. Responde de forma concisa y práctica en español.

Contexto del vault:
${vaultContext || "Sin contexto disponible."}

Reglas:
- Responde basándote SOLO en el contexto del vault cuando sea relevante
- Si no sabes algo, dilo — no inventes
- Cuando menciones un documento del vault, usa el formato [[título del documento]] para que sea clickeable. Ejemplo: "Revisa [[Customer Persona]] para más detalles"
- Sugiere documentos del vault cuando sea útil
- Respuestas cortas, directo al punto`;

  try {
    if (provider === "anthropic") {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1024,
          system: systemPrompt,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      if (data.error) return { error: data.error.message };
      return { content: data.content?.[0]?.text || "", provider: "anthropic" };
    }

    if (provider === "openai") {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          max_tokens: 1024,
          messages: [{ role: "system", content: systemPrompt }, ...messages.map((m) => ({ role: m.role, content: m.content }))],
        }),
      });
      const data = await res.json();
      if (data.error) return { error: data.error.message };
      return { content: data.choices?.[0]?.message?.content || "", provider: "openai" };
    }

    if (provider === "gemini") {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
        }),
      });
      const data = await res.json();
      if (data.error) return { error: data.error.message };
      return { content: data.candidates?.[0]?.content?.parts?.[0]?.text || "", provider: "gemini" };
    }

    if (provider === "groq") {
      // Groq uses OpenAI-compatible API
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          max_tokens: 1024,
          messages: [{ role: "system", content: systemPrompt }, ...messages.map((m) => ({ role: m.role, content: m.content }))],
        }),
      });
      const data = await res.json();
      if (data.error) return { error: data.error.message };
      return { content: data.choices?.[0]?.message?.content || "", provider: "groq" };
    }

    if (provider === "cohere") {
      const res = await fetch("https://api.cohere.com/v2/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "command-r",
          messages: [{ role: "system", content: systemPrompt }, ...messages.map((m) => ({ role: m.role, content: m.content }))],
        }),
      });
      const data = await res.json();
      if (data.message) return { error: data.message };
      return { content: data.message?.content?.[0]?.text || data.text || "", provider: "cohere" };
    }

    return { error: `Provider "${provider}" no soportado.` };
  } catch (err) {
    return { error: err.message };
  }
});

safeHandle("notes:open-external-window", async (_, { url }) => {
  shell.openExternal(url);
  return { ok: true };
});

// ─── Integrated Terminal ─────────────────────────────────────────────────────

let ptyProcess = null;
let ptyWebContents = null;

safeHandle("notes:terminal-create", async (event, payload) => {
  if (ptyProcess) { ptyProcess.kill(); ptyProcess = null; }

  const pty = require("node-pty");
  const root = await ensureVaultRoot();
  const mcpScript = path.join(__dirname, "..", "scripts", "docs-mcp.mjs");

  ptyWebContents = event.sender;

  const mode = payload?.mode || "shell";
  let cmd, args, env;

  if (mode === "gemini") {
    // Add MCP server to Gemini CLI config (idempotent)
    const { execSync } = require("child_process");
    try { execSync(`gemini mcp remove kuilo-vault 2>/dev/null`, { stdio: "ignore" }); } catch {}
    try { execSync(`gemini mcp add kuilo-vault -- node ${mcpScript} ${root}`, { stdio: "ignore" }); } catch {}

    cmd = "gemini";
    args = [];
    env = { ...process.env, TERM: "xterm-256color" };
  } else if (mode === "claude") {
    // Add kuilo-vault MCP to Claude's global config
    const os = require("os");
    const claudeConfigPath = path.join(os.homedir(), ".claude.json");
    try {
      const raw = await fs.readFile(claudeConfigPath, "utf8");
      const claudeConfig = JSON.parse(raw);
      if (!claudeConfig.mcpServers) claudeConfig.mcpServers = {};
      claudeConfig.mcpServers["kuilo-vault"] = { command: "node", args: [mcpScript, root] };
      await fs.writeFile(claudeConfigPath, JSON.stringify(claudeConfig, null, 2), "utf8");
    } catch (e) {
      process.stderr.write(`[terminal] Could not update claude config: ${e.message}\n`);
    }

    cmd = "claude";
    args = [];
    env = { ...process.env, TERM: "xterm-256color" };
  } else {
    cmd = process.platform === "win32" ? "powershell.exe" : process.env.SHELL || "/bin/zsh";
    args = [];
    env = { ...process.env, TERM: "xterm-256color" };
  }

  ptyProcess = pty.spawn(cmd, args, {
    name: "xterm-256color",
    cols: 80,
    rows: 24,
    cwd: root,
    env,
  });

  ptyProcess.onData((data) => {
    try { ptyWebContents?.send("terminal-data", data); } catch {}
  });

  ptyProcess.onExit(() => {
    try { ptyWebContents?.send("terminal-exit"); } catch {}
    ptyProcess = null;
  });

  return { ok: true, shell };
});

safeHandle("notes:terminal-write", async (_, { data }) => {
  if (ptyProcess) ptyProcess.write(data);
});

safeHandle("notes:terminal-resize", async (_, { cols, rows }) => {
  if (ptyProcess) ptyProcess.resize(cols, rows);
});

safeHandle("notes:terminal-kill", async () => {
  if (ptyProcess) { ptyProcess.kill(); ptyProcess = null; }
});

// ─── MCP Connectors ──────────────────────────────────────────────────────────

const isMac = process.platform === "darwin";
const appSupport = isMac
  ? path.join(os.homedir(), "Library", "Application Support")
  : path.join(os.homedir(), "AppData", "Roaming"); // Windows fallback

const AI_TARGETS = {
  "claude-desktop": {
    label: "Claude Desktop",
    configPath: path.join(appSupport, "Claude", "claude_desktop_config.json"),
    detectDir: path.join(appSupport, "Claude"),
  },
  cursor: {
    label: "Cursor",
    configPath: path.join(os.homedir(), ".cursor", "mcp.json"),
    detectDir: path.join(os.homedir(), ".cursor"),
  },
  windsurf: {
    label: "Windsurf",
    configPath: path.join(os.homedir(), ".codeium", "windsurf", "mcp_config.json"),
    detectDir: path.join(os.homedir(), ".codeium", "windsurf"),
  },
};

const MCP_SERVER_KEY = "kuilo-vault";

async function resolveScriptPath() {
  // Script lives at <project-root>/scripts/docs-mcp.mjs
  // __dirname = electron/ in dev, or app.asar/electron/ in prod
  const candidates = [
    path.join(__dirname, "..", "scripts", "docs-mcp.mjs"),
    path.join(__dirname, "scripts", "docs-mcp.mjs"),
    path.join(process.resourcesPath || "", "scripts", "docs-mcp.mjs"),
  ];
  for (const p of candidates) {
    if (await pathExists(p)) return p;
  }
  return null;
}

async function inspectTarget(name, target, scriptPath, vaultPath) {
  const { label, configPath, detectDir } = target;

  // 1. Check if the tool is installed
  const installed = await pathExists(detectDir);

  // 2. Read config if it exists
  let configExists = false;
  let connected = false;
  let configEntry = null;
  let configValid = false;
  let error = null;

  try {
    if (await pathExists(configPath)) {
      configExists = true;
      const raw = await fs.readFile(configPath, "utf8");
      const config = JSON.parse(raw);
      configEntry = config.mcpServers?.[MCP_SERVER_KEY] || null;
      connected = !!configEntry;

      if (connected) {
        // 3. Validate: do the paths in the config actually exist?
        const entryScript = configEntry.args?.[0];
        const entryVault  = configEntry.args?.[1];
        const scriptOk = entryScript && (await pathExists(entryScript));
        const vaultOk  = entryVault  && (await pathExists(entryVault));

        if (!scriptOk) error = `Script no encontrado: ${entryScript}`;
        else if (!vaultOk) error = `Vault no encontrado: ${entryVault}`;
        else configValid = true;

        // Check if paths match current vault/script
        if (configValid && (entryScript !== scriptPath || entryVault !== vaultPath)) {
          error = "Config apunta a un vault/script diferente al actual";
        }
      }
    }
  } catch (e) {
    error = `Error leyendo config: ${e.message}`;
  }

  return {
    name,
    label,
    configPath,
    installed,
    configExists,
    connected,
    configValid: connected && configValid && !error,
    configEntry,
    error,
  };
}

safeHandle("notes:get-mcp-info", async () => {
  const vaultPath = await getVaultRoot();
  const scriptPath = await resolveScriptPath();
  const vaultExists = await pathExists(vaultPath);
  const scriptExists = !!scriptPath;

  const targets = [];
  for (const [name, target] of Object.entries(AI_TARGETS)) {
    targets.push(await inspectTarget(name, target, scriptPath, vaultPath));
  }

  return {
    vaultPath,
    vaultExists,
    scriptPath: scriptPath || "(no encontrado)",
    scriptExists,
    targets,
  };
});

safeHandle("notes:configure-ai-connector", async (_, { target }) => {
  const vaultPath = await getVaultRoot();
  const scriptPath = await resolveScriptPath();

  if (!scriptPath) throw new Error("MCP script no encontrado en el proyecto");
  if (!(await pathExists(vaultPath))) throw new Error(`Vault no existe: ${vaultPath}`);

  const t = AI_TARGETS[target];
  if (!t) throw new Error(`Target desconocido: ${target}`);

  // Read or create config
  let config = {};
  try {
    if (await pathExists(t.configPath)) {
      config = JSON.parse(await fs.readFile(t.configPath, "utf8"));
    }
  } catch {}

  if (!config.mcpServers) config.mcpServers = {};
  config.mcpServers[MCP_SERVER_KEY] = {
    command: "node",
    args: [scriptPath, vaultPath],
  };

  await fs.mkdir(path.dirname(t.configPath), { recursive: true });
  await fs.writeFile(t.configPath, JSON.stringify(config, null, 2), "utf8");

  // Verify what we just wrote
  const verification = await inspectTarget(target, t, scriptPath, vaultPath);
  return { ok: true, configPath: t.configPath, verification };
});

safeHandle("notes:disconnect-ai-connector", async (_, { target }) => {
  const t = AI_TARGETS[target];
  if (!t) throw new Error(`Target desconocido: ${target}`);

  if (await pathExists(t.configPath)) {
    const config = JSON.parse(await fs.readFile(t.configPath, "utf8"));
    if (config.mcpServers?.[MCP_SERVER_KEY]) {
      delete config.mcpServers[MCP_SERVER_KEY];
      await fs.writeFile(t.configPath, JSON.stringify(config, null, 2), "utf8");
    }
  }

  return { ok: true };
});

// ─── PDF Export ──────────────────────────────────────────────────────────────

safeHandle("notes:export-pdf", async (_, { html, title, css }) => {
  // Ask user where to save
  const slug = (title || "document").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const { filePath, canceled } = await dialog.showSaveDialog({
    defaultPath: path.join(app.getPath("documents"), `${slug}.pdf`),
    filters: [{ name: "PDF", extensions: ["pdf"] }],
  });
  if (canceled || !filePath) return { ok: false };

  // Create a hidden window to render the content
  const pdfWin = new BrowserWindow({
    show: false,
    width: 800,
    height: 600,
    webPreferences: { offscreen: true },
  });

  const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.25/dist/katex.min.css">
  <style>
    @page { margin: 2cm; size: A4; }
    * { box-sizing: border-box; }
    body {
      font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #1d1d1f;
      line-height: 1.65;
      font-size: 11pt;
      max-width: 100%;
      padding: 0;
      margin: 0;
    }

    /* ── Typography ── */
    h1 { font-size: 22pt; font-weight: 700; margin: 0.8em 0 0.3em; }
    h2 { font-size: 16pt; font-weight: 700; margin: 1em 0 0.3em; }
    h3 { font-size: 13pt; font-weight: 700; margin: 1em 0 0.3em; }
    h4 { font-size: 11pt; font-weight: 700; margin: 1em 0 0.3em; }
    p { margin: 0.4em 0; }

    /* ── Code ── */
    pre {
      background: #f5f5f7;
      padding: 12px 16px;
      border-radius: 6px;
      font-size: 9pt;
      line-height: 1.5;
      overflow-x: auto;
      page-break-inside: avoid;
    }
    code {
      font-family: "JetBrains Mono NL", ui-monospace, monospace;
      background: #f0f0f2;
      padding: 1px 4px;
      border-radius: 3px;
      font-size: 0.9em;
    }
    pre code { background: none; padding: 0; }

    /* ── Blockquote ── */
    blockquote {
      border-left: 3px solid #d1d1d6;
      margin: 0.8em 0;
      padding: 0.4em 1em;
      color: #555;
    }

    /* ── Tables ── */
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 0.8em 0;
      font-size: 10pt;
      page-break-inside: avoid;
    }
    th, td {
      border: 1px solid #d1d1d6;
      padding: 6px 10px;
      text-align: left;
    }
    th { background: #f5f5f7; font-weight: 600; }

    /* ── Images ── */
    img {
      max-width: 100%;
      height: auto;
      border-radius: 6px;
      page-break-inside: avoid;
    }

    /* ── Lists ── */
    ul, ol { padding-left: 1.5em; margin: 0.4em 0; }
    li { margin: 0.2em 0; }
    ul[data-type="taskList"] {
      list-style: none;
      padding-left: 0;
    }
    ul[data-type="taskList"] li { position: relative; padding-left: 1.4em; }
    ul[data-type="taskList"] li::before { content: "☐ "; position: absolute; left: 0; }
    ul[data-type="taskList"] li[data-checked="true"]::before { content: "☑ "; }

    /* ── Divider ── */
    hr { border: none; border-top: 1px solid #e5e5ea; margin: 1.5em 0; }

    /* ── Columns ── */
    .columns-layout { display: flex; gap: 16px; }
    .column-item { flex: 1; min-width: 0; }

    /* ── Math ── */
    .math-block-wrapper { margin: 0.8em 0; text-align: center; }
    .math-source { display: none; }

    /* ── TOC ── */
    .toc-wrapper { page-break-inside: avoid; }

    /* ── Toggle ── */
    [data-type="toggle-list"] { border: none; }
    [data-type="toggle-summary"]::before { content: "▸ "; }
    [data-type="toggle-list"][data-open="true"] > [data-type="toggle-summary"]::before { content: "▾ "; }

    /* ── Mermaid ── */
    .mermaid-preview { page-break-inside: avoid; }
    .mermaid-controls { display: none; }
    .mermaid-diagram-area { min-height: 100px; }

    /* ── Code block wrapper ── */
    .code-block-wrapper {
      background: #f5f5f7;
      border-radius: 6px;
      overflow: hidden;
      margin: 0.8em 0;
      page-break-inside: avoid;
    }
    .code-block-header { display: none; }
    .code-block-wrapper pre {
      margin: 0;
      border: none;
    }

    /* ── Hide editor-only elements ── */
    .mm-btn, .mm-expand-btn, .mm-close-btn { display: none; }

    ${css || ""}
  </style>
</head>
<body>
  <div class="simple-editor ProseMirror">
    ${html}
  </div>
</body>
</html>`;

  const tmpHtml = path.join(app.getPath("temp"), `kuilo-pdf-${Date.now()}.html`);
  await fs.writeFile(tmpHtml, fullHtml, "utf8");
  await pdfWin.loadFile(tmpHtml);
  await new Promise((r) => setTimeout(r, 1500));
  fs.unlink(tmpHtml).catch(() => {});

  const pdfBuffer = await pdfWin.webContents.printToPDF({
    printBackground: true,
    preferCSSPageSize: true,
    margins: { top: 0.75, bottom: 0.75, left: 0.75, right: 0.75 },
  });

  await fs.writeFile(filePath, pdfBuffer);
  pdfWin.close();

  // Open the PDF
  shell.openPath(filePath);
  return { ok: true, filePath };
});

safeHandle("notes:export-book", async (_, { html, title, css }) => {
  const slug = (title || "book").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const { filePath, canceled } = await dialog.showSaveDialog({
    defaultPath: path.join(app.getPath("documents"), `${slug}.pdf`),
    filters: [{ name: "PDF", extensions: ["pdf"] }],
  });
  if (canceled || !filePath) return { ok: false };

  const pdfWin = new BrowserWindow({
    show: false,
    width: 800,
    height: 1100,
    webPreferences: { offscreen: true },
  });

  const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.25/dist/katex.min.css">
  <style>${css || ""}</style>
</head>
<body>${html}</body>
</html>`;

  // Write to temp file (data URLs fail for large HTML)
  const tmpHtml = path.join(app.getPath("temp"), `kuilo-book-${Date.now()}.html`);
  await fs.writeFile(tmpHtml, fullHtml, "utf8");
  await pdfWin.loadFile(tmpHtml);
  await new Promise((r) => setTimeout(r, 2500));

  const pdfBuffer = await pdfWin.webContents.printToPDF({
    printBackground: true,
    preferCSSPageSize: true,
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
  });

  await fs.writeFile(filePath, pdfBuffer);
  pdfWin.close();
  // Cleanup temp
  fs.unlink(tmpHtml).catch(() => {});
  shell.openPath(filePath);
  return { ok: true, filePath };
});

// ─── Publish to Web ─────────────────────────────────────────────────────────

safeHandle("notes:publish-site", async (_, { files }) => {
  const { filePaths, canceled } = await dialog.showOpenDialog({
    title: "Elegir carpeta para publicar",
    properties: ["openDirectory", "createDirectory"],
    buttonLabel: "Publicar aquí",
  });
  if (canceled || !filePaths?.[0]) return { ok: false };

  const outDir = filePaths[0];
  for (const file of files) {
    const fullPath = path.join(outDir, file.path);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, file.content, "utf8");
  }

  shell.openPath(outDir);
  return { ok: true, outDir, totalFiles: files.length };
});

// ─── Workflow Pipeline ──────────────────────────────────────────────────────

safeHandle("notes:read-workflow", async (_, { packageName }) => {
  const root = await ensureVaultRoot();
  const pkgDir = packageName === "__root__" ? root : path.join(root, packageName);
  const wfPath = path.join(pkgDir, "workflow.json");
  if (!(await pathExists(wfPath))) return null;
  return readJson(wfPath);
});

safeHandle("notes:save-workflow", async (_, { packageName, workflow }) => {
  const root = await ensureVaultRoot();
  const pkgDir = packageName === "__root__" ? root : path.join(root, packageName);
  await fs.mkdir(pkgDir, { recursive: true });
  const wfPath = path.join(pkgDir, "workflow.json");
  await fs.writeFile(wfPath, JSON.stringify(workflow, null, 2), "utf8");
  return { ok: true };
});

// ─── Git Backup ──────────────────────────────────────────────────────────────

let gitBackup = null;

async function loadGitBackup() {
  if (gitBackup) return gitBackup;
  gitBackup = await import("../src/lib/git-backup.js");
  return gitBackup;
}

safeHandle("notes:backup-init", async () => {
  const vaultPath = await getVaultRoot();
  const backup = await loadGitBackup();
  await backup.initRepo(vaultPath);
  return { ok: true, vaultPath };
});

safeHandle("notes:backup-status", async () => {
  const vaultPath = await getVaultRoot();
  const backup = await loadGitBackup();
  const status = await backup.getStatus(vaultPath);
  const log = await backup.getLog(vaultPath, 5);
  return { ...status, log, vaultPath };
});

safeHandle("notes:backup-commit", async (_, { message }) => {
  const vaultPath = await getVaultRoot();
  const backup = await loadGitBackup();
  await backup.initRepo(vaultPath);
  return backup.commitAll(vaultPath, message || `Backup ${new Date().toISOString().split("T")[0]}`);
});

safeHandle("notes:backup-push", async (_, { url, token }) => {
  const vaultPath = await getVaultRoot();
  const backup = await loadGitBackup();
  return backup.pushToRemote(vaultPath, { url, token });
});

safeHandle("notes:backup-log", async () => {
  const vaultPath = await getVaultRoot();
  const backup = await loadGitBackup();
  return backup.getLog(vaultPath, 20);
});

// Auto-backup: commit after each save (debounced)
let autoBackupTimer = null;
const scheduleAutoBackup = () => {
  clearTimeout(autoBackupTimer);
  autoBackupTimer = setTimeout(async () => {
    try {
      const backup = await loadGitBackup();
      const vaultPath = await getVaultRoot();
      await backup.initRepo(vaultPath);
      const result = await backup.commitAll(vaultPath, `Auto-backup ${new Date().toLocaleString("es-MX")}`);
      if (result.committed) {
        process.stderr.write(`[kuilo] auto-backup: ${result.sha?.slice(0, 7)}\n`);
      }
    } catch (err) {
      process.stderr.write(`[kuilo] auto-backup error: ${err.message}\n`);
    }
  }, 30000); // 30s after last save
};


app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
