/**
 * Block-level diff for Tiptap JSON documents.
 * Compares two arrays of blocks using LCS to produce a visual diff.
 */

const serialize = (block) => JSON.stringify(block);

/**
 * Longest Common Subsequence table (O(n*m), fine for <200 blocks).
 */
function lcsTable(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Uint16Array(n + 1));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp;
}

/**
 * Walk the LCS table to produce diff entries.
 */
function backtrack(dp, oldKeys, newKeys, oldBlocks, newBlocks) {
  const entries = [];
  let i = oldKeys.length;
  let j = newKeys.length;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldKeys[i - 1] === newKeys[j - 1]) {
      entries.push({ status: "equal", block: newBlocks[j - 1] });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      entries.push({ status: "added", block: newBlocks[j - 1] });
      j--;
    } else {
      entries.push({ status: "removed", block: oldBlocks[i - 1] });
      i--;
    }
  }

  return entries.reverse();
}

/**
 * Post-process: consecutive removed+added of same type → modified.
 */
function detectModified(entries) {
  const result = [];
  for (let i = 0; i < entries.length; i++) {
    const curr = entries[i];
    const next = entries[i + 1];
    if (
      curr.status === "removed" && next?.status === "added" &&
      curr.block.type === next.block.type
    ) {
      result.push({ status: "modified", block: next.block, oldBlock: curr.block });
      i++; // skip next
    } else {
      result.push(curr);
    }
  }
  return result;
}

/**
 * Diff two arrays of Tiptap JSON blocks.
 * @param {Array} oldBlocks - Blocks from the old version
 * @param {Array} newBlocks - Blocks from the current version
 * @returns {Array<{status: "equal"|"added"|"removed"|"modified", block, oldBlock?}>}
 */
export function diffBlocks(oldBlocks = [], newBlocks = []) {
  const oldKeys = oldBlocks.map(serialize);
  const newKeys = newBlocks.map(serialize);
  const dp = lcsTable(oldKeys, newKeys);
  const raw = backtrack(dp, oldKeys, newKeys, oldBlocks, newBlocks);
  return detectModified(raw);
}

/**
 * Extract plain text from a Tiptap JSON block (for display in diff view).
 */
export function blockToText(block) {
  if (!block) return "";
  if (typeof block.content === "string") return block.content;
  if (Array.isArray(block.content)) {
    return block.content.map((n) => {
      if (typeof n.text === "string") return n.text;
      if (Array.isArray(n.content)) return blockToText(n);
      return "";
    }).join("");
  }
  return block.text || "";
}
