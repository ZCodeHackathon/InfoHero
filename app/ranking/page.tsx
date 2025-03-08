"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import PostItem from "../post/Post";
import Avatar from "@mui/material/Avatar";
import { Badge, Comment, Post, Profile } from "@/components/types";

export default function RankingPage() {
    const [user, setUser] = useState<any>(null);
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [activeTab, setActiveTab] = useState<"posts" | "heroes">("posts");
    const [userLikes, setUserLikes] = useState<string[]>([]);
    const [userUnlikes, setUserUnlikes] = useState<string[]>([]);
    const [userCommentLikes, setUserCommentLikes] = useState<string[]>([]);
    const [userCommentUnlikes, setUserCommentUnlikes] = useState<string[]>([]);
    const supabase = createClient();
    const router = useRouter();

    const fetchPosts = useCallback(async () => {
        try {
      /*      const { data, error } = await supabase.query(`
  SELECT 
    p.id,
    p.*, 
    COUNT(DISTINCT l.post_id) AS like_count,
    COUNT(DISTINCT u.post_id) AS unlike_count,
    COUNT(DISTINCT l.post_id) - COUNT(DISTINCT u.post_id) AS net_likes
FROM 
    "Post" p
LEFT JOIN 
    "Likes" l ON p.id = l.post_id
LEFT JOIN 
    "Unlikes" u ON p.id = u.post_id
GROUP BY 
    p.id
ORDER BY 
    net_likes DESC
LIMIT 10;
`);*/
            const { data, error } = await supabase.rpc('get_top_posts_by_likes');

            console.log(data);
            if (error) {
                console.error("Error fetching posts:", error);
                return;
            }
            const postIds = data.map((post: Post) => post.id);

            const { data: likes, error: likesError } = await supabase
                .from("Likes")
                .select("*")
                .in("post_id", postIds);

            if (likesError) {
                console.error("Error fetching likes:", likesError);
                return;
            }

            const { data: unlikes, error: unlikesError } = await supabase
                .from("Unlikes")
                .select("*")
                .in("post_id", postIds);

            if (unlikesError) {
                console.error("Error fetching unlikes:", unlikesError);
                return;
            }

            const { data: comments, error: commentsError } = await supabase
                .from("Comments")
                .select("*")
                .in("post_id", postIds);

            if (commentsError) {
                console.error("Error fetching comments:", commentsError);
                return;
            }

            const { data: LikesComments, error: likesCommentsError } = await supabase
                .from("LikesComments")
                .select("*")
                .in("post_id", postIds);

            if (commentsError) {
                console.error("Error fetching comments likes:", likesCommentsError);
                return;
            }

            const { data: postBadges, error: postBadgesError } = await supabase
                .from("post_badges")
                .select("*")
                .in("post_id", postIds);

            if (postBadgesError) {
                console.error("Error fetching post_badges:", postBadgesError);
                return;
            }
            const badgeIds = postBadges.map((postBadge) => postBadge.badge_id);

            const { data: badges, error: badgesError } = await supabase
                .from("badges")
                .select("*")
                .in("id", badgeIds);

            if (badgesError) {
                console.error("Error fetching badges:", badgesError);
                return;
            }
            const badgeMap = new Map(badges.map((badge) => [badge.id, badge]));

            const { data: commentLikes, error: commentLikesError } = await supabase
                .from("LikesComments")
                .select("*")
                .in(
                    "comment_id",
                    comments.map((comment: any) => comment.id)
                );

            if (commentLikesError) {
                console.error("Error fetching comment likes:", commentLikesError);
                return;
            }

            const { data: commentUnlikes, error: commentUnlikesError } =
                await supabase
                    .from("UnlikesComments")
                    .select("*")
                    .in(
                        "comment_id",
                        comments.map((comment: any) => comment.id)
                    );

            if (commentUnlikesError) {
                console.error("Error fetching comment unlikes:", commentUnlikesError);
                return;
            }

            // Update the postsWithCommentsAndBadges mapping
            const postsWithCommentsAndBadges = data.map((post: Post) => ({
                ...post,
                unlikes: unlikes.filter(
                    (unlike: { post_id: string }) => unlike.post_id === post.id
                ).length,
                likes: likes.filter(
                    (like: { post_id: string }) => like.post_id === post.id
                ).length,
                comments: comments
                    .filter((comment: { post_id: string }) => comment.post_id === post.id)
                    .map((comment: any) => ({
                        ...comment,
                        likes: commentLikes.filter(
                            (like: { comment_id: string }) => like.comment_id === comment.id
                        ).length,
                        unlikes: commentUnlikes.filter(
                            (unlike: { comment_id: string }) =>
                                unlike.comment_id === comment.id
                        ).length,
                        userHasLiked: userCommentLikes.includes(comment.id),
                        userHasUnliked: userCommentUnlikes.includes(comment.id),
                    })),
                badges: postBadges
                    .filter((pb) => pb.post_id === post.id)
                    .map((pb) => badgeMap.get(pb.badge_id)),
            }));
       //     console.log(postsWithCommentsAndBadges);

            const sortedPosts = [...postsWithCommentsAndBadges].sort((a, b) => {
                // Wybierz odpowiednie pole do sortowania:
                // 1. Jeśli masz pole net_likes z serwera:
                //   return (b.net_likes || 0) - (a.net_likes || 0);
                // 2. Lub oblicz różnicę lokalnie:
                return ((b.likes || 0) - (b.unlikes || 0)) - ((a.likes || 0) - (a.unlikes || 0));
            });

            console.log(sortedPosts);
            setPosts(sortedPosts);


            //setPosts(postsWithCommentsAndBadges);

     //       console.log(badges);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
        setLoading(false);

    }, [supabase]);

    const fetchProfiles = useCallback(async () => {
        try {
            const { data, error } = await supabase.rpc('get_top_users_by_likes');
            console.log('ASD ASD' , data);
            if (error) {
                console.error("Błąd pobierania profili:", error);
                router.push("/"); // Przekierowanie, jeśli profil nie istnieje
            } else {
                setProfiles(data);
            }
        } catch (error) {
            console.error("Błąd podczas ładowania danych:", error);
        } finally {
            setLoading(false);
        }
    }, [router, supabase]);

    const fetchUser = useCallback(async () => {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (user) {
            const { data: profile } = await supabase
                .from("profiles")
                .select("username")
                .eq("id", user.id)
                .single();
            setUser({ ...user, username: profile?.username });
        }
    }, [supabase]);
    const fetchUserLikes = useCallback(async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from("Likes")
            .select("post_id")
            .eq("user_id", user.id);

        if (error) {
            console.error("Error fetching user likes:", error);
        } else {
            setUserLikes(data.map((like: { post_id: string }) => like.post_id));
        }
    }, [supabase, user]);

    const fetchUserUnlikes = useCallback(async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from("Unlikes")
            .select("post_id")
            .eq("user_id", user.id);

        if (error) {
            console.error("Error fetching user unlikes:", error);
        } else {
            setUserUnlikes(data.map((unlike: { post_id: string }) => unlike.post_id));
        }
    }, [supabase, user]);

    const fetchUserCommentLikes = useCallback(async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from("LikesComments")
            .select("comment_id")
            .eq("user_id", user.id);

        if (error) {
            console.error("Error fetching user comment likes:", error);
        } else {
            setUserCommentLikes(
                data.map((like: { comment_id: string }) => like.comment_id)
            );
        }
    }, [supabase, user]);

    const fetchUserCommentUnlikes = useCallback(async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from("UnlikesComments")
            .select("comment_id")
            .eq("user_id", user.id);

        if (error) {
            console.error("Error fetching user comment unlikes:", error);
        } else {
            setUserCommentUnlikes(
                data.map((unlike: { comment_id: string }) => unlike.comment_id)
            );
        }
    }, [supabase, user]);

    const handleToggleLike = async (postId: string) => {
        if (!user) {
            router.push("/sign-in");
            return;
        }

        const hasLiked = userLikes.includes(postId);

        if (hasLiked) {
            const { error } = await supabase
                .from("Likes")
                .delete()
                .eq("user_id", user.id)
                .eq("post_id", postId);

            if (error) {
                console.error("Error unliking post:", error);
            } else {
                setUserLikes((prevLikes) => prevLikes.filter((id) => id !== postId));
                fetchPosts(); // Fetch updated posts
            }
        } else {
            const { error } = await supabase
                .from("Likes")
                .insert([
                    { user_id: user.id, user_name: user.username, post_id: postId },
                ]);

            if (error) {
                console.error("Error liking post:", error);
            } else {
                setUserLikes((prevLikes) => [...prevLikes, postId]);
                fetchPosts(); // Fetch updated posts
            }
        }
    };

    const handleToggleUnlike = async (postId: string) => {
        if (!user) {
            router.push("/sign-in");
            return;
        }

        const hasUnliked = userUnlikes.includes(postId);

        if (hasUnliked) {
            const { error } = await supabase
                .from("Unlikes")
                .delete()
                .eq("user_id", user.id)
                .eq("post_id", postId);

            if (error) {
                console.error("Error undisliking post:", error);
            } else {
                setUserUnlikes((prevUnlikes) =>
                    prevUnlikes.filter((id) => id !== postId)
                );
                fetchPosts(); // Fetch updated posts
            }
        } else {
            const { error } = await supabase
                .from("Unlikes")
                .insert([
                    { user_id: user.id, user_name: user.username, post_id: postId },
                ]);

            if (error) {
                console.error("Error disliking post:", error);
            } else {
                setUserUnlikes((prevUnlikes) => [...prevUnlikes, postId]);

                fetchPosts(); // Fetch updated posts
            }
        }
    };
    const handleComment = async (postId: string, commentContent: string) => {
        if (!user) {
            router.push("/sign-in");
            return;
        }

        const newComment = {
            user_id: user.id,
            user_name: user.username,
            post_id: postId,
            content: commentContent,
            created_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
            .from("Comments")
            .insert([newComment])
            .select();

        if (error) {
            console.error("Error adding comment:", error);
        } else {
            fetchPosts(); // Fetch updated posts
        }
    };

    const handleDeleteComment = async (commentId: string, postId: string) => {
        console.log("Deleting comment with ID:", commentId);
        if (!commentId) {
            console.error("Invalid commentId:", commentId);
            return;
        }

        const { error } = await supabase
            .from("Comments")
            .delete()
            .eq("id", commentId);

        if (error) {
            console.error("Error deleting comment:", error);
        } else {
            fetchPosts(); // Fetch updated posts
        }
    };
    const handleToggleCommentLike = async (commentId: string) => {
        if (!user) {
            router.push("/sign-in");
            return;
        }

        const hasLiked = userCommentLikes.includes(commentId);

        if (hasLiked) {
            const { error } = await supabase
                .from("LikesComments")
                .delete()
                .eq("user_id", user.id)
                .eq("comment_id", commentId);

            if (error) {
                console.error("Error unliking comment:", error);
            } else {
                setUserCommentLikes((prevLikes) =>
                    prevLikes.filter((id) => id !== commentId)
                );
                fetchPosts(); // Fetch updated posts
            }
        } else {
            const { error } = await supabase
                .from("LikesComments")
                .insert([
                    { user_id: user.id, user_name: user.username, comment_id: commentId },
                ]);

            if (error) {
                console.error("Error liking comment:", error);
            } else {
                setUserCommentLikes((prevLikes) => [...prevLikes, commentId]);
                fetchPosts(); // Fetch updated posts
            }
        }
    };

    const handleToggleCommentUnlike = async (commentId: string) => {
        if (!user) {
            router.push("/sign-in");
            return;
        }
    }
    useEffect(() => {
        fetchUserCommentLikes();
        fetchUserCommentUnlikes();
    }, [fetchUserCommentLikes, fetchUserCommentUnlikes]);

    useEffect(() => {
        fetchUserLikes();
        fetchUserUnlikes();
    }, [fetchUserLikes, fetchUserUnlikes]);

    useEffect(() => {
        fetchPosts();
        fetchUser();
        fetchProfiles();
    }, [fetchPosts, fetchUser]);


    return (
        <div className="flex flex-col items-center p-4">
            <div className="w-full md:w-7/12 max-w-5xl">
                <h1 className="text-2xl font-semibold mt-4">Rankingi</h1>


                {/* Navbar z przełączaniem między postami a komentarzami */}
                <div className="mt-8 mb-4 flex space-x-4">
                    <button
                        className={`px-4 py-2 rounded-md ${activeTab === "posts" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
                        onClick={() => setActiveTab("posts")}
                    >
                        Posty
                    </button>
                    <button
                        className={`px-4 py-2 rounded-md ${activeTab === "heroes" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
                        onClick={() => setActiveTab("heroes")}
                    >
                        Bohaterowie wiarygodności
                    </button>
                </div>

                {/* Dynamiczny widok postów lub bohaterów */}
                {activeTab === "posts" && (
                    <div>
                        <h2 className="text-xl font-semibold">Najlepsze posty</h2>
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
                                        onToggleCommentLike={(commentId) =>
                                            handleToggleCommentLike(commentId)
                                        }
                                        onToggleCommentUnlike={(commentId) =>
                                            handleToggleCommentUnlike(commentId)
                                        }
                                        onComment={(commentContent) =>
                                            handleComment(post.id, commentContent)
                                        }
                                        onDeleteComment={(commentId) =>
                                            handleDeleteComment(commentId, post.id)
                                        }
                                        router={router}
                                    />
                                ))
                            ) : (
                                <p>Brak postów.</p>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === "heroes" && (
                    <div>
                        <h2 className="text-xl font-semibold">Bohaterowie wiarygodności</h2>
                        <div className="space-y-4">
                            {profiles.length > 0 ? (
                                profiles.map((profile) => (
                                    <div key={profile.id} className="border-t pt-2 mt-2">
                                        <div className="flex items-center">
                                            <Avatar
                                                className="mr-2"
                                                src={profile.avatar_url}
                                                alt={profile.username}
                                            />
                                            <p className="font-semibold">{profile.username}</p>
                                            <p className="font-semibold">Liczba polubień: {profile.total_likes}</p>
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
