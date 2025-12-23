import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useRecommendations } from "@/hooks/useRecommendations";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Lock, BookOpen } from "lucide-react";

interface Post {
  id: string;
  user_id: string;
  title: string;
  content_preview: string;
  content_full: string;
  image_url: string | null;
  created_at: string;
  username: string;
  profile_pic_url: string;
}

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const recommendations = useRecommendations(post, allPosts, 3);

  useEffect(() => {
    if (id) {
      fetchPost(id);
      fetchAllPosts();
    }
  }, [id]);

  const fetchPost = async (postId: string) => {
    const { data: postData, error: postError } = await supabase
      .from("posts")
      .select("id, user_id, title, content_preview, content_full, image_url, created_at")
      .eq("id", postId)
      .maybeSingle();

    if (postError || !postData) {
      setLoading(false);
      return;
    }

    // Fetch profile for this post
    const { data: profileData } = await supabase
      .from("profiles")
      .select("username, profile_pic_url")
      .eq("user_id", postData.user_id)
      .maybeSingle();

    setPost({
      ...postData,
      username: profileData?.username || "Anonymous",
      profile_pic_url: profileData?.profile_pic_url || "",
    });
    setLoading(false);
  };

  const fetchAllPosts = async () => {
    const { data: postsData } = await supabase
      .from("posts")
      .select("id, user_id, title, content_preview, content_full, image_url, created_at")
      .order("created_at", { ascending: false });

    if (postsData) {
      // Get profiles for posts
      const userIds = [...new Set(postsData.map((p) => p.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, username, profile_pic_url")
        .in("user_id", userIds);

      const profilesMap = new Map(profilesData?.map((p) => [p.user_id, p]) || []);

      setAllPosts(
        postsData.map((p) => ({
          ...p,
          username: profilesMap.get(p.user_id)?.username || "Anonymous",
          profile_pic_url: profilesMap.get(p.user_id)?.profile_pic_url || "",
        }))
      );
    }
  };

  const formattedDate = post
    ? new Date(post.created_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  if (loading || authLoading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-background">
          <article className="container max-w-3xl py-8">
            <Skeleton className="h-8 w-3/4 mb-4" />
            <Skeleton className="h-6 w-1/3 mb-8" />
            <Skeleton className="h-64 w-full rounded-lg mb-8" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </article>
        </main>
      </>
    );
  }

  if (!post) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h1 className="font-serif text-2xl font-bold text-foreground mb-4">
              Story not found
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
        <article className="container max-w-3xl py-8">
          {/* Back link */}
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to stories
          </Link>

          {/* Title */}
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
            {post.title}
          </h1>

          {/* Author info */}
          <div className="flex items-center gap-3 mb-8 pb-6 border-b border-border">
            <Link to={`/author/${post.user_id}`}>
              <Avatar className="h-10 w-10">
                <AvatarImage src={post.profile_pic_url} alt={post.username} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {post.username?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div>
              <Link
                to={`/author/${post.user_id}`}
                className="font-medium text-foreground hover:text-primary transition-colors"
              >
                {post.username}
              </Link>
              <time className="block text-sm text-muted-foreground">{formattedDate}</time>
            </div>
          </div>

          {/* Image */}
          {post.image_url && (
            <div className="mb-8 rounded-lg overflow-hidden bg-muted">
              <img
                src={post.image_url}
                alt=""
                className={`w-full h-auto max-h-96 object-cover ${!user ? "image-blur" : ""}`}
                loading="lazy"
              />
            </div>
          )}

          {/* Content */}
          {user ? (
            <div className="story-content text-lg leading-relaxed whitespace-pre-wrap">
              {post.content_full}
            </div>
          ) : (
            <div className="relative">
              <div className="content-blur">
                <div className="story-content text-lg leading-relaxed whitespace-pre-wrap">
                  {post.content_preview}
                </div>
              </div>

              {/* Login CTA overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-background pt-16 pb-4">
                <div className="bg-card border border-border rounded-lg p-6 text-center shadow-elevated">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                    <Lock className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-serif text-xl font-bold text-foreground mb-2">
                    Continue reading
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Sign in to unlock the full story and discover more content
                  </p>
                  <Button variant="cta" size="lg" asChild>
                    <Link to="/auth">Sign in to read more</Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </article>

        {/* Recommendations */}
        {user && recommendations.length > 0 && (
          <section className="container max-w-3xl py-8 border-t border-border">
            <h3 className="flex items-center gap-2 font-serif text-xl font-bold text-foreground mb-6">
              <BookOpen className="h-5 w-5 text-primary" />
              You might also enjoy
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recommendations.map((rec) => (
                <Link
                  key={rec.id}
                  to={`/post/${rec.id}`}
                  className="group block p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
                >
                  {rec.image_url && (
                    <div className="h-24 rounded-md overflow-hidden mb-3 bg-muted">
                      <img
                        src={rec.image_url}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  )}
                  <h4 className="font-serif font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {rec.title}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {rec.content_preview}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <footer className="border-t border-border bg-background py-6 mt-12">
          <div className="container text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} StoryPeek. All rights reserved.</p>
          </div>
        </footer>
      </main>
    </>
  );
}
