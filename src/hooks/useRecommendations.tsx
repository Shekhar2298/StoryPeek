import { useMemo } from "react";

interface RecommendablePost {
  id: string;
  title: string;
  content_preview: string;
  user_id: string;
  created_at: string;
}

// Extract keywords from text
function extractKeywords(text: string): string[] {
  // Common stop words to filter out
  const stopWords = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "is", "it", "that", "this", "was", "were",
    "are", "be", "been", "being", "have", "has", "had", "do", "does", "did",
    "will", "would", "could", "should", "may", "might", "must", "shall",
    "i", "you", "he", "she", "we", "they", "my", "your", "his", "her", "our",
    "their", "its", "who", "what", "when", "where", "why", "how", "which",
    "as", "if", "so", "than", "very", "just", "about", "into", "through",
  ]);

  return text
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !stopWords.has(word));
}

// Calculate similarity between two posts based on keywords
function calculateSimilarity(post1: RecommendablePost, post2: RecommendablePost): number {
  if (post1.id === post2.id) return 0;

  const keywords1 = new Set(extractKeywords(`${post1.title} ${post1.content_preview}`));
  const keywords2 = new Set(extractKeywords(`${post2.title} ${post2.content_preview}`));

  if (keywords1.size === 0 || keywords2.size === 0) return 0;

  // Calculate Jaccard similarity
  const intersection = [...keywords1].filter((k) => keywords2.has(k)).length;
  const union = new Set([...keywords1, ...keywords2]).size;

  const jaccardScore = intersection / union;

  // Boost if same author
  const authorBoost = post1.user_id === post2.user_id ? 0.2 : 0;

  // Recency factor (prefer newer posts)
  const daysDiff = Math.abs(
    (new Date(post1.created_at).getTime() - new Date(post2.created_at).getTime()) /
      (1000 * 60 * 60 * 24)
  );
  const recencyFactor = Math.max(0, 1 - daysDiff / 365); // Decay over a year

  return jaccardScore * 0.6 + authorBoost + recencyFactor * 0.2;
}

export function useRecommendations<T extends RecommendablePost>(
  currentPost: T | null,
  allPosts: T[],
  limit: number = 3
): T[] {
  return useMemo(() => {
    if (!currentPost || allPosts.length === 0) {
      return [];
    }

    // Calculate similarity scores
    const scored = allPosts
      .filter((post) => post.id !== currentPost.id)
      .map((post) => ({
        post,
        score: calculateSimilarity(currentPost, post),
      }))
      .sort((a, b) => b.score - a.score);

    // Return top recommendations
    return scored.slice(0, limit).map((item) => item.post);
  }, [currentPost, allPosts, limit]);
}

// Hook to get trending posts based on recency
export function useTrendingPosts<T extends RecommendablePost>(
  posts: T[],
  limit: number = 5
): T[] {
  return useMemo(() => {
    const now = new Date().getTime();
    const hourMs = 1000 * 60 * 60;

    // Score based on recency (exponential decay)
    const scored = posts.map((post) => {
      const ageHours = (now - new Date(post.created_at).getTime()) / hourMs;
      // Higher score for newer posts
      const recencyScore = Math.exp(-ageHours / 168); // Decay over ~1 week
      return { post, score: recencyScore };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((item) => item.post);
  }, [posts, limit]);
}
