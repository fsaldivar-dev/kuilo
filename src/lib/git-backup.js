/**
 * git-backup.js
 * Auto-backup del vault usando isomorphic-git.
 * Funciona sin git CLI instalado — puro JavaScript.
 */

import git from "isomorphic-git";
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";

const AUTHOR = { name: "Kuilo", email: "kuilo@local" };

/**
 * Initialize a git repo in the given directory.
 * No-op if already initialized.
 */
export async function initRepo(dir) {
  const gitDir = path.join(dir, ".git");
  const exists = await fs.access(gitDir).then(() => true).catch(() => false);
  if (exists) return;
  await git.init({ fs: fsSync, dir });
}

/**
 * Get the status of all files in the repo.
 * Returns { hasChanges, files: [{ path, status }] }
 */
export async function getStatus(dir) {
  const matrix = await git.statusMatrix({ fs: fsSync, dir });
  const files = [];

  for (const [filepath, head, workdir, stage] of matrix) {
    // Skip .git and .DS_Store
    if (filepath.startsWith(".git") || filepath === ".DS_Store") continue;

    // [1,1,1] = unchanged, anything else = changed
    if (head !== 1 || workdir !== 1 || stage !== 1) {
      let status = "modified";
      if (head === 0 && workdir === 2) status = "added";
      if (head === 1 && workdir === 0) status = "deleted";
      files.push({ path: filepath, status });
    }
  }

  return { hasChanges: files.length > 0, files };
}

/**
 * Stage all changes and commit.
 * Returns { committed, sha } or { committed: false } if nothing to commit.
 */
export async function commitAll(dir, message = "Auto-backup") {
  const { hasChanges, files } = await getStatus(dir);
  if (!hasChanges) return { committed: false };

  // Stage all changes
  for (const file of files) {
    if (file.status === "deleted") {
      await git.remove({ fs: fsSync, dir, filepath: file.path });
    } else {
      await git.add({ fs: fsSync, dir, filepath: file.path });
    }
  }

  const sha = await git.commit({
    fs: fsSync,
    dir,
    message,
    author: AUTHOR,
  });

  return { committed: true, sha };
}

/**
 * Get commit log.
 * Returns [{ sha, message, date }]
 */
export async function getLog(dir, depth = 10) {
  try {
    const log = await git.log({ fs: fsSync, dir, depth });
    return log.map((entry) => ({
      sha: entry.oid,
      message: entry.commit.message,
      date: new Date(entry.commit.author.timestamp * 1000).toISOString(),
    }));
  } catch {
    return [];
  }
}

/**
 * Add a remote and push. Requires an auth token.
 * Returns { pushed: true } or throws.
 */
export async function pushToRemote(dir, { url, token }) {
  // Ensure remote exists
  const remotes = await git.listRemotes({ fs: fsSync, dir });
  const hasOrigin = remotes.some((r) => r.remote === "origin");

  if (!hasOrigin) {
    await git.addRemote({ fs: fsSync, dir, remote: "origin", url });
  } else {
    // Update URL if changed
    await git.deleteRemote({ fs: fsSync, dir, remote: "origin" });
    await git.addRemote({ fs: fsSync, dir, remote: "origin", url });
  }

  const http = await import("isomorphic-git/http/node/index.js").then(m => m.default || m);

  await git.push({
    fs: fsSync,
    http,
    dir,
    remote: "origin",
    ref: "main",
    onAuth: () => ({ username: "x-access-token", password: token }),
  });

  return { pushed: true };
}
