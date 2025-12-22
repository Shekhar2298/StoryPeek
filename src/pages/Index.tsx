import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { PostCard } from "@/components/PostCard";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface Post {
  id: string;
  user_id: string;
  title: string;
  content_preview: string;
  image_url: string | null;
  created_at: string;
  profiles: {
    username: string;
    profile_pic_url: string;
  };
}

export default function Index() {
  const { user, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from("posts")
      .select(`
        id,
        user_id,
        title,
        content_preview,
        image_url,
        created_at,
        profiles!posts_user_id_fkey (
          username,
          profile_pic_url
        )
      `)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setPosts(data as unknown as Post[]);
    }
    setLoading(false);
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <div className="container py-8">
          <header className="mb-8">
            <h1 className="font-serif text-3xl font-bold text-foreground mb-2">
              Discover Stories
            </h1>
            <p className="text-muted-foreground">
              Explore stories from writers around India
            </p>
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
          ) : posts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">
                No stories yet. Be the first to share!
              </p>
            </div>
          ) : (
            <div>
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  id={post.id}
                  title={post.title}
                  contentPreview={post.content_preview}
                  imageUrl={post.image_url}
                  author={{
                    username: post.profiles?.username || "Anonymous",
                    profilePicUrl: post.profiles?.profile_pic_url || "",
                    userId: post.user_id,
                  }}
                  createdAt={post.created_at}
                  isAuthenticated={!!user}
                />
              ))}
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
