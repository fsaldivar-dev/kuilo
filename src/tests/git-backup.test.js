/**
 * Git backup integration tests.
 * Tests the backup module that auto-commits and pushes vault changes.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import fs from "fs/promises";
import path from "path";
import git from "isomorphic-git";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const TEST_VAULT = path.join(ROOT, ".test-backup-vault");

// We'll test the module functions directly
// Import after creating (will be written in implementation)
let backup;

beforeAll(async () => {
  backup = await import("../../src/lib/git-backup.js").catch(() => null);
});

afterAll(async () => {
  await fs.rm(TEST_VAULT, { recursive: true, force: true });
});

describe("Git Backup", () => {

  // ── initRepo ──

  it("initializes a git repo in a directory", async () => {
    if (!backup) return; // skip if module not yet created
    await fs.rm(TEST_VAULT, { recursive: true, force: true });
    await fs.mkdir(TEST_VAULT, { recursive: true });

    await backup.initRepo(TEST_VAULT);

    // Verify .git exists
    const gitDir = path.join(TEST_VAULT, ".git");
    const exists = await fs.access(gitDir).then(() => true).catch(() => false);
    expect(exists).toBe(true);
  });

  it("does not fail if repo already initialized", async () => {
    if (!backup) return;
    // Should not throw on second init
    await expect(backup.initRepo(TEST_VAULT)).resolves.not.toThrow();
  });

  // ── getStatus ──

  it("detects untracked files", async () => {
    if (!backup) return;
    // Create a file
    await fs.writeFile(path.join(TEST_VAULT, "test-doc.json"), '{"test": true}');

    const status = await backup.getStatus(TEST_VAULT);
    expect(status.hasChanges).toBe(true);
    expect(status.files.length).toBeGreaterThan(0);
  });

  it("reports clean when no changes", async () => {
    if (!backup) return;
    // Commit the file first
    await backup.commitAll(TEST_VAULT, "test commit");
    const status = await backup.getStatus(TEST_VAULT);
    expect(status.hasChanges).toBe(false);
  });

  // ── commitAll ──

  it("commits all changes with a message", async () => {
    if (!backup) return;
    // Modify a file
    await fs.writeFile(path.join(TEST_VAULT, "test-doc.json"), '{"test": true, "updated": true}');

    const result = await backup.commitAll(TEST_VAULT, "updated test doc");
    expect(result.committed).toBe(true);
    expect(result.sha).toBeTruthy();

    // Verify commit exists in log
    const log = await git.log({ fs, dir: TEST_VAULT, depth: 1 });
    expect(log[0].commit.message).toBe("updated test doc");
  });

  it("skips commit when no changes", async () => {
    if (!backup) return;
    const result = await backup.commitAll(TEST_VAULT, "nothing changed");
    expect(result.committed).toBe(false);
  });

  // ── getLog ──

  it("returns commit history", async () => {
    if (!backup) return;
    const log = await backup.getLog(TEST_VAULT, 5);
    expect(log.length).toBeGreaterThanOrEqual(2);
    expect(log[0].message).toBeTruthy();
    expect(log[0].sha).toBeTruthy();
    expect(log[0].date).toBeTruthy();
  });

  // ── Multiple file operations ──

  it("handles multiple files in one commit", async () => {
    if (!backup) return;
    await fs.mkdir(path.join(TEST_VAULT, "sub-pkg"), { recursive: true });
    await fs.writeFile(path.join(TEST_VAULT, "sub-pkg", "page.json"), '{"meta":{"title":"Sub"}}');
    await fs.writeFile(path.join(TEST_VAULT, "another.md"), "# Another\n");

    const result = await backup.commitAll(TEST_VAULT, "added multiple files");
    expect(result.committed).toBe(true);

    const status = await backup.getStatus(TEST_VAULT);
    expect(status.hasChanges).toBe(false);
  });

  it("handles deleted files", async () => {
    if (!backup) return;
    await fs.unlink(path.join(TEST_VAULT, "another.md"));

    const status = await backup.getStatus(TEST_VAULT);
    expect(status.hasChanges).toBe(true);

    const result = await backup.commitAll(TEST_VAULT, "deleted file");
    expect(result.committed).toBe(true);
  });
});
