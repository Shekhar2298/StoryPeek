import { useState, useMemo } from "react";

interface SearchableItem {
  id: string;
  title: string;
  content_preview: string;
  content_full?: string;
}

// Calculate relevance score based on multiple factors
function calculateRelevance(item: SearchableItem, searchTerms: string[]): number {
  let score = 0;
  const title = item.title.toLowerCase();
  const preview = item.content_preview.toLowerCase();
  const fullContent = item.content_full?.toLowerCase() || "";

  searchTerms.forEach((term) => {
    // Title exact match (highest weight)
    if (title === term) score += 100;
    
    // Title starts with term
    else if (title.startsWith(term)) score += 50;
    
    // Title contains term (word boundary)
    else if (new RegExp(`\\b${escapeRegex(term)}\\b`).test(title)) score += 30;
    
    // Title contains term (partial)
    else if (title.includes(term)) score += 15;

    // Content contains term (word boundary)
    if (new RegExp(`\\b${escapeRegex(term)}\\b`).test(preview)) score += 10;
    else if (preview.includes(term)) score += 5;

    // Full content match
    if (new RegExp(`\\b${escapeRegex(term)}\\b`).test(fullContent)) score += 3;
    else if (fullContent.includes(term)) score += 1;

    // Frequency bonus
    const titleFreq = (title.match(new RegExp(escapeRegex(term), "g")) || []).length;
    const contentFreq = (preview.match(new RegExp(escapeRegex(term), "g")) || []).length;
    score += titleFreq * 5 + contentFreq * 2;
  });

  return score;
}

function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function useSearch<T extends SearchableItem>(items: T[]) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAndRankedItems = useMemo(() => {
    if (!searchQuery.trim()) {
      return items;
    }

    const searchTerms = searchQuery
      .toLowerCase()
      .split(/\s+/)
      .filter((term) => term.length > 0);

    if (searchTerms.length === 0) {
      return items;
    }

    // Filter items that match at least one term
    const matchedItems = items.filter((item) => {
      const searchableText = `${item.title} ${item.content_preview}`.toLowerCase();
      return searchTerms.some((term) => searchableText.includes(term));
    });

    // Sort by relevance score
    return matchedItems.sort((a, b) => {
      const scoreA = calculateRelevance(a, searchTerms);
      const scoreB = calculateRelevance(b, searchTerms);
      return scoreB - scoreA;
    });
  }, [items, searchQuery]);

  return {
    searchQuery,
    setSearchQuery,
    filteredItems: filteredAndRankedItems,
    hasResults: filteredAndRankedItems.length > 0,
    isSearching: searchQuery.trim().length > 0,
  };
}
