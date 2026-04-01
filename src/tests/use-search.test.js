import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// Set window.notesApi BEFORE importing the hook (it captures api at module load)
window.notesApi = {
  searchContent: vi.fn().mockResolvedValue([]),
};

const { useSearch } = await import("@/hooks/use-search");

describe("useSearch", () => {
  const packages = [
    { name: "docs", pages: [
      { title: "Getting Started", children: [] },
      { title: "API Reference", children: [] },
    ]},
    { name: "guides", pages: [
      { title: "Deployment Guide", children: [] },
    ]},
  ];

  beforeEach(() => {
    window.notesApi.searchContent.mockReset().mockResolvedValue([
      { packageName: "docs", pagePath: "readme.md", title: "Readme", snippet: "...match..." },
    ]);
  });

  it("returns all packages when no query", () => {
    const { result } = renderHook(() => useSearch(packages));
    expect(result.current.filteredPackages).toHaveLength(2);
    expect(result.current.searchQuery).toBe("");
  });

  it("filters packages by page title", async () => {
    const { result } = renderHook(() => useSearch(packages));
    await act(async () => { await result.current.handleSearch("api"); });
    expect(result.current.filteredPackages).toHaveLength(1);
    expect(result.current.filteredPackages[0].name).toBe("docs");
  });

  it("filters by package name", async () => {
    const { result } = renderHook(() => useSearch(packages));
    await act(async () => { await result.current.handleSearch("guides"); });
    expect(result.current.filteredPackages).toHaveLength(1);
    expect(result.current.filteredPackages[0].name).toBe("guides");
  });

  it("clears results when query emptied", async () => {
    const { result } = renderHook(() => useSearch(packages));
    await act(async () => { await result.current.handleSearch("test"); });
    await act(async () => { await result.current.handleSearch(""); });
    expect(result.current.searchResults).toBeNull();
    expect(result.current.searchQuery).toBe("");
  });

  it("calls searchContent API", async () => {
    const { result } = renderHook(() => useSearch(packages));
    await act(async () => { await result.current.handleSearch("readme"); });
    expect(window.notesApi.searchContent).toHaveBeenCalledWith({ query: "readme" });
  });

  it("returns empty filteredPackages for no match", async () => {
    const { result } = renderHook(() => useSearch(packages));
    await act(async () => { await result.current.handleSearch("zzzznonexistent"); });
    expect(result.current.filteredPackages).toHaveLength(0);
  });
});
