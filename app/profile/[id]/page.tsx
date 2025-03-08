"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import PostItem from "../../post/Post";
import Avatar from "@mui/material/Avatar";
import { Badge, Comment, Post, Profile } from "@/components/types";

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]); // Załadowanie postów użytkownika
  const [comments, setComments] = useState<Comment[]>([]); // Załadowanie komentarzy użytkownika
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"posts" | "comments">("posts"); // State do przełączania między postami i komentarzami
  const [userLikes, setUserLikes] = useState<string[]>([]);
  const [userUnlikes, setUserUnlikes] = useState<string[]>([]);
  const { id } = useParams(); // Pobieranie UUID użytkownika z URL
  const supabase = createClient();
  const router = useRouter();

  const fetchProfile = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, created_at")
        .eq("id", id) // Użycie UUID do załadowania profilu
        .single();

      if (error) {
        console.error("Błąd ładowania profilu:", error);
        router.push("/"); // Przekierowanie, jeśli profil nie istnieje
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error("Błąd podczas ładowania danych:", error);
    } finally {
      setLoading(false);
    }
  }, [id, router, supabase]);

  const fetchUserPosts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("Post")
        .select("*")
        .eq("user_id", id) // Załadowanie postów na podstawie UUID
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Błąd ładowania postów użytkownika:", error);
      } else {
        const postIds = data.map((post: Post) => post.id);

        const { data: comments, error: commentsError } = await supabase
          .from("Comments")
          .select("*")
          .in("post_id", postIds);

        if (commentsError) {
          console.error("Błąd ładowania komentarzy:", commentsError);
        }

        const { data: postBadges, error: postBadgesError } = await supabase
          .from("post_badges")
          .select("*")
          .in("post_id", postIds);

        if (postBadgesError) {
          console.error("Błąd ładowania odznak:", postBadgesError);
        }

        const badgeIds =
          postBadges?.map((postBadge: any) => postBadge.badge_id) || [];
        const { data: badges, error: badgesError } = await supabase
          .from("badges")
          .select("*")
          .in("id", badgeIds);

        if (badgesError) {
          console.error("Błąd ładowania badge:", badgesError);
        }

        const { data: likes, error: likesError } = await supabase
          .from("Likes")
          .select("*")
          .in("post_id", postIds);

        if (likesError) {
          console.error("Błąd ładowania like'ów:", likesError);
        }

        const { data: unlikes, error: unlikesError } = await supabase
          .from("Unlikes")
          .select("*")
          .in("post_id", postIds);

        if (unlikesError) {
          console.error("Błąd ładowania unlikes:", unlikesError);
        }

        const badgeMap = new Map(
          badges?.map((badge: Badge) => [badge.id, badge])
        );

        const postsWithDetails = data.map((post: Post) => ({
          ...post,
          comments:
            comments?.filter(
              (comment: Comment) => comment.post_id === post.id
            ) || [],
          badges: postBadges
            ? postBadges
                .filter((pb: any) => pb.post_id === post.id)
                .map((pb: any) => badgeMap.get(pb.badge_id))
            : [],
          likes:
            likes?.filter(
              (like: { post_id: string }) => like.post_id === post.id
            ).length || 0,
          unlikes:
            unlikes?.filter(
              (unlike: { post_id: string }) => unlike.post_id === post.id
            ).length || 0,
        }));

        setPosts(postsWithDetails);
      }
    } catch (error) {
      console.error("Błąd podczas ładowania postów:", error);
    }
  }, [id, supabase]);

  const fetchUserLikes = useCallback(async () => {
    if (!profile) return;
    const { data, error } = await supabase
      .from("Likes")
      .select("post_id")
      .eq("user_id", profile.id);

    if (error) {
      console.error("Error fetching user likes:", error);
    } else {
      setUserLikes(data.map((like: { post_id: string }) => like.post_id));
    }
  }, [supabase, profile]);

  const fetchUserUnlikes = useCallback(async () => {
    if (!profile) return;
    const { data, error } = await supabase
      .from("Unlikes")
      .select("post_id")
      .eq("user_id", profile.id);

    if (error) {
      console.error("Error fetching user unlikes:", error);
    } else {
      setUserUnlikes(data.map((unlike: { post_id: string }) => unlike.post_id));
    }
  }, [supabase, profile]);

  const handleToggleLike = async (postId: string) => {
    if (!profile) {
      router.push("/sign-in");
      return;
    }

    const hasLiked = userLikes.includes(postId);

    if (hasLiked) {
      const { error } = await supabase
        .from("Likes")
        .delete()
        .eq("user_id", profile.id)
        .eq("post_id", postId);

      if (error) {
        console.error("Error unliking post:", error);
      } else {
        setUserLikes((prevLikes) => prevLikes.filter((id) => id !== postId));
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.id === postId ? { ...post, likes: post.likes - 1 } : post
          )
        );
      }
    } else {
      const { error } = await supabase
        .from("Likes")
        .insert([
          { user_id: profile.id, user_name: profile.username, post_id: postId },
        ]);

      if (error) {
        console.error("Error liking post:", error);
      } else {
        setUserLikes((prevLikes) => [...prevLikes, postId]);
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.id === postId ? { ...post, likes: post.likes + 1 } : post
          )
        );
      }
    }
  };

  const handleToggleUnlike = async (postId: string) => {
    if (!profile) {
      router.push("/sign-in");
      return;
    }

    const hasUnliked = userUnlikes.includes(postId);

    if (hasUnliked) {
      const { error } = await supabase
        .from("Unlikes")
        .delete()
        .eq("user_id", profile.id)
        .eq("post_id", postId);

      if (error) {
        console.error("Error undisliking post:", error);
      } else {
        setUserUnlikes((prevUnlikes) =>
          prevUnlikes.filter((id) => id !== postId)
        );
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.id === postId ? { ...post, unlikes: post.unlikes - 1 } : post
          )
        );
      }
    } else {
      const { error } = await supabase
        .from("Unlikes")
        .insert([
          { user_id: profile.id, user_name: profile.username, post_id: postId },
        ]);

      if (error) {
        console.error("Error disliking post:", error);
      } else {
        setUserUnlikes((prevUnlikes) => [...prevUnlikes, postId]);
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.id === postId ? { ...post, unlikes: post.unlikes + 1 } : post
          )
        );
      }
    }
  };

  const fetchUserComments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("Comments")
        .select("*")
        .eq("user_id", id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Błąd ładowania komentarzy użytkownika:", error);
      } else {
        setComments(data);
      }
    } catch (error) {
      console.error("Błąd podczas ładowania komentarzy:", error);
    }
  }, [id, supabase]);

  useEffect(() => {
    if (id) {
      fetchProfile();
      fetchUserPosts();
      fetchUserComments(); // Fetch user comments
    }
  }, [id, fetchProfile, fetchUserPosts, fetchUserComments]);

  useEffect(() => {
    fetchUserLikes();
    fetchUserUnlikes();
  }, [fetchUserLikes, fetchUserUnlikes]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!profile) {
    return <div>Nie znaleziono użytkownika.</div>;
  }

  return (
    <div className="flex flex-col items-center p-4">
      <div className="w-full md:w-7/12 max-w-5xl">
        <div className="flex flex-col items-center">
          <h1 className="text-2xl font-semibold">{profile.username}</h1>
          <p>Dołączył: {new Date(profile.created_at).toLocaleDateString()}</p>
        </div>

        {/* Navbar z przełączaniem między postami a komentarzami */}
        <div className="mt-8 mb-4 flex space-x-4">
          <button
            className={`px-4 py-2 rounded-md ${activeTab === "posts" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
            onClick={() => setActiveTab("posts")}
          >
            Posty
          </button>
          <button
            className={`px-4 py-2 rounded-md ${activeTab === "comments" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
            onClick={() => setActiveTab("comments")}
          >
            Komentarze
          </button>
        </div>

        {/* Dynamiczny widok postów lub komentarzy */}
        {activeTab === "posts" && (
          <div>
            <h2 className="text-xl font-semibold">Posty użytkownika</h2>
            <div className="space-y-4">
              {posts.length > 0 ? (
                posts.map((post) => (
                  <PostItem
                    key={post.id}
                    id={post.id}
                    user_id={post.user_id}
                    user_name={post.user_name}
                    user_avatar={post.user_avatar}
                    title={post.title}
                    image_url={post.image_url}
                    content={post.content}
                    hashtags={post.hashtags}
                    likes={post.likes}
                    unlikes={post.unlikes}
                    comments={post.comments}
                    badges={post.badges}
                    userHasLiked={userLikes.includes(post.id)}
                    userHasUnliked={userUnlikes.includes(post.id)}
                    onToggleLike={() => handleToggleLike(post.id)}
                    onToggleUnlike={() => handleToggleUnlike(post.id)}
                    onComment={() => {}}
                    onDeleteComment={() => {}}
                    currentUser={profile} // Jeśli profile to aktualny użytkownik
                    router={router}
                  />
                ))
              ) : (
                <p>Brak postów.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === "comments" && (
          <div>
            <h2 className="text-xl font-semibold">Komentarze użytkownika</h2>
            <div className="space-y-4">
              {comments.length > 0 ? (
                comments.map((comment) => (
                  <div key={comment.id} className="border-t pt-2 mt-2">
                    <div className="flex items-center">
                      <Avatar src={comment.user_avatar} />
                      <div className="ml-2">
                        <p className="text-sm text-gray-500">
                          {comment.user_name} -{" "}
                          {new Date(comment.created_at).toLocaleString()}
                        </p>
                        <p>{comment.content}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p>Brak komentarzy.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
