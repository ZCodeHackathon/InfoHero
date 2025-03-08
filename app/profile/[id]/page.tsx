'use client'
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import PostItem from "../../post/Post";
import Avatar from "@mui/material/Avatar";

type Profile = {
  id: string;
  username: string;
  created_at: string;
};

type Comment = {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar: string;
  post_id: string;
  content: string;
  created_at: string;
};

type Badge = {
  id: string;
  name: string;
};

type Post = {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar: string;
  title: string;
  image_url?: string;
  content: string;
  hashtags: string[];
  likes: number;
  comments: Comment[];
  badges: Badge[];
  created_at: string;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]); // Załadowanie postów użytkownika
  const [comments, setComments] = useState<Comment[]>([]); // Załadowanie komentarzy użytkownika
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'comments'>('posts'); // State do przełączania między postami i komentarzami
  const { id } = useParams(); // Pobieranie UUID użytkownika z URL
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
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
    };

    const fetchUserPosts = async () => {
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

          const badgeIds = postBadges.map((postBadge: any) => postBadge.badge_id);
          const { data: badges, error: badgesError } = await supabase
            .from("badges")
            .select("*")
            .in("id", badgeIds);

          if (badgesError) {
            console.error("Błąd ładowania badge:", badgesError);
          }

          const badgeMap = new Map(badges.map((badge: Badge) => [badge.id, badge]));
          
          // Dodanie komentarzy i odznak do postów
          const postsWithDetails = data.map((post: Post) => ({
            ...post,
            comments: comments.filter((comment: Comment) => comment.post_id === post.id),
            badges: postBadges
              .filter((pb: any) => pb.post_id === post.id)
              .map((pb: any) => badgeMap.get(pb.badge_id)),
          }));

          setPosts(postsWithDetails);
        }
      } catch (error) {
        console.error("Błąd podczas ładowania postów:", error);
      }
    };

    const fetchUserComments = async () => {
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
    };

    if (id) {
      fetchProfile();
      fetchUserPosts();
      fetchUserComments(); // Fetch user comments
    }
  }, [id, supabase, router]);

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
            className={`px-4 py-2 rounded-md ${activeTab === 'posts' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setActiveTab('posts')}
          >
            Posty
          </button>
          <button
            className={`px-4 py-2 rounded-md ${activeTab === 'comments' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setActiveTab('comments')}
          >
            Komentarze
          </button>
        </div>

        {/* Dynamiczny widok postów lub komentarzy */}
        {activeTab === 'posts' && (
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
                    comments={post.comments}
                    badges={post.badges}
                    userHasLiked={false} // Możesz zaktualizować na podstawie stanu użytkownika
                    onToggleLike={() => {}}
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

        {activeTab === 'comments' && (
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
