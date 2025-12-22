import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { PostCard } from "@/components/PostCard";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Profile {
  id: string;
  user_id: string;
  username: string;
  profile_pic_url: string;
  created_at: string;
}

interface Post {
  id: string;
  title: string;
  content_preview: string;
  image_url: string | null;
  created_at: string;
}

export default function AuthorProfile() {
  const { userId } = useParams<{ userId: string }>();
  const { user, loading: authLoading } = useAuth();
  const [author, setAuthor] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchAuthorData(userId);
    }
  }, [userId]);

  const fetchAuthorData = async (authorUserId: string) => {
    // Fetch author profile
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", authorUserId)
      .maybeSingle();

    if (!profileError && profileData) {
      setAuthor(profileData);
    }

    // Fetch author's posts
    const { data: postsData, error: postsError } = await supabase
      .from("posts")
      .select("id, title, content_preview, image_url, created_at")
      .eq("user_id", authorUserId)
      .order("created_at", { ascending: false });

    if (!postsError && postsData) {
      setPosts(postsData);
    }

    setLoading(false);
  };

  const memberSince = author
    ? new Date(author.created_at).toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
      })
    : "";

  if (loading || authLoading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-background">
          <div className="container max-w-3xl py-8">
            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-border">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <div className="space-y-6">
              {[1, 2].map((i) => (
                <div key={i} className="flex gap-4 py-6 border-b border-border">
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </>
    );
  }

  if (!author) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h1 className="font-serif text-2xl font-bold text-foreground mb-4">
              Author not found
            </h1>
            <Button variant="outline" asChild>
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to stories
              </Link>
            </Button>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <div className="container max-w-3xl py-8">
          {/* Back link */}
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to stories
          </Link>

          {/* Author header */}
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-border">
            <Avatar className="h-20 w-20">
              <AvatarImage src={author.profile_pic_url} alt={author.username} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {author.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-serif text-2xl font-bold text-foreground">
                {author.username}
              </h1>
              <p className="text-muted-foreground">Member since {memberSince}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {posts.length} {posts.length === 1 ? "story" : "stories"}
              </p>
            </div>
          </div>

          {/* Author's posts */}
          <section>
            <h2 className="font-serif text-xl font-bold text-foreground mb-4">
              Stories by {author.username}
            </h2>

            {posts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No stories published yet.
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
                      username: author.username,
                      profilePicUrl: author.profile_pic_url,
                    }}
                    createdAt={post.created_at}
                    isAuthenticated={!!user}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        <footer className="border-t border-border bg-background py-6 mt-12">
          <div className="container text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} StoryPeek. All rights reserved.</p>
          </div>
        </footer>
      </main>
    </>
  );
}
