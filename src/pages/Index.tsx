import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { PostCard } from "@/components/PostCard";
import { SearchBar } from "@/components/SearchBar";
import { useAuth } from "@/hooks/useAuth";
import { useSearch } from "@/hooks/useSearch";
import { useTrendingPosts } from "@/hooks/useRecommendations";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp } from "lucide-react";

interface Post {
  id: string;
  user_id: string;
  title: string;
  content_preview: string;
  image_url: string | null;
  created_at: string;
  username: string;
  profile_pic_url: string;
}

export default function Index() {
  const { user, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const { searchQuery, setSearchQuery, filteredItems, isSearching } = useSearch(posts);
  const trendingPosts = useTrendingPosts(posts, 5);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    // Use separate queries since there's no foreign key relationship
    const { data: postsData, error: postsError } = await supabase
      .from("posts")
      .select("id, user_id, title, content_preview, image_url, created_at")
      .order("created_at", { ascending: false });

    if (postsError || !postsData) {
      setLoading(false);
      return;
    }

    // Get unique user IDs
    const userIds = [...new Set(postsData.map((p) => p.user_id))];

    // Fetch profiles for those users
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("user_id, username, profile_pic_url")
      .in("user_id", userIds);

    // Create a map for quick lookup
    const profilesMap = new Map(
      profilesData?.map((p) => [p.user_id, p]) || []
    );

    // Combine posts with profiles
    const combinedPosts: Post[] = postsData.map((post) => {
      const profile = profilesMap.get(post.user_id);
      return {
        ...post,
        username: profile?.username || "Anonymous",
        profile_pic_url: profile?.profile_pic_url || "",
      };
    });

    setPosts(combinedPosts);
    setLoading(false);
  };

  const displayPosts = isSearching ? filteredItems : posts;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <div className="container py-8">
          <header className="mb-8">
            <h1 className="font-serif text-3xl font-bold text-foreground mb-2">
              Discover Stories
            </h1>
            <p className="text-muted-foreground mb-6">
              Explore stories from writers around India
            </p>

            {/* Search Bar */}
            <div className="max-w-md">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search stories by title or keywords..."
              />
            </div>
          </header>

          {loading || authLoading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4 py-6 border-b border-border">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-6 w-6 rounded-full" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                  <Skeleton className="hidden sm:block h-28 w-28 rounded-md" />
                </div>
              ))}
            </div>
          ) : displayPosts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">
                {isSearching
                  ? "No stories found matching your search."
                  : "No stories yet. Be the first to share!"}
              </p>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main content */}
              <div className="lg:col-span-2">
                {isSearching && (
                  <p className="text-sm text-muted-foreground mb-4">
                    Found {displayPosts.length} {displayPosts.length === 1 ? "story" : "stories"}
                  </p>
                )}
                {displayPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    id={post.id}
                    title={post.title}
                    contentPreview={post.content_preview}
                    imageUrl={post.image_url}
                    author={{
                      username: post.username,
                      profilePicUrl: post.profile_pic_url,
                      userId: post.user_id,
                    }}
                    createdAt={post.created_at}
                    isAuthenticated={!!user}
                  />
                ))}
              </div>

              {/* Sidebar - Trending */}
              {!isSearching && trendingPosts.length > 0 && (
                <aside className="hidden lg:block">
                  <div className="sticky top-20">
                    <h3 className="flex items-center gap-2 font-serif text-lg font-bold text-foreground mb-4">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Trending Stories
                    </h3>
                    <div className="space-y-4">
                      {trendingPosts.slice(0, 5).map((post, index) => (
                        <a
                          key={post.id}
                          href={user ? `/post/${post.id}` : "/auth"}
                          className="block group"
                        >
                          <div className="flex gap-3">
                            <span className="text-2xl font-bold text-muted-foreground/50">
                              {String(index + 1).padStart(2, "0")}
                            </span>
                            <div>
                              <h4 className="font-serif font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                                {post.title}
                              </h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                {new Date(post.created_at).toLocaleDateString("en-IN", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </p>
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                </aside>
              )}
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-border bg-background py-6">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} StoryPeek. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}
