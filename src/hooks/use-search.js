import { useMemo, useState } from "react";
import { filterPages } from "@/lib/tree-helpers";

const api = window.notesApi;

export function useSearch(packages) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);

  const filteredPackages = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return packages;
    return packages
      .map((pkg) => ({
        ...pkg,
        pages: pkg.name.toLowerCase().includes(query)
          ? pkg.pages || []
          : filterPages(pkg.pages || [], query),
      }))
      .filter((pkg) => pkg.name.toLowerCase().includes(query) || pkg.pages.length > 0);
  }, [packages, searchQuery]);

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) { setSearchResults(null); return; }
    if (api?.searchContent) {
      const results = await api.searchContent({ query: query.trim() });
      setSearchResults(results);
    } else {
      setSearchResults(null);
    }
  };

  return {
    searchQuery,
    searchResults,
    filteredPackages,
    handleSearch,
  };
}
