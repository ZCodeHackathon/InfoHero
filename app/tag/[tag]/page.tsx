'use client';

import { createClient } from "@/utils/supabase/client";
import { useState, useEffect, useCallback } from "react";
import {useParams, useRouter} from "next/navigation";
import PostItem from "../../post/Post"; // Import komponentu PostItem

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
}
type Post = {
    id: string;
    user_id: string;
    user_name: string;
    user_avatar: string;
    title: string;
    image_url: string;
    content: string;
    hashtags: string[];
    likes: number;
    comments: Comment[];
    badges: Badge[];
    created_at: string;
};

export default function Tag() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [user, setUser] = useState<any>(null);
    const [userLikes, setUserLikes] = useState<string[]>([]);
    const supabase = createClient();
    const router = useRouter();
    const params = useParams();
    const {tag} = params;

    const fetchPosts = useCallback(async () => {
        try{
            const { data: singleBadge, error: singleBadgeError } = await supabase
                .from("badges")
                .select("id, name")
                .ilike("name", tag.toString())
                .single();

            if (singleBadgeError) {
                console.error("Error fetching badge:", singleBadgeError);
                setPosts([]);
                alert("Nie znaleziono postów z podanym tagiem!");
                router.push("/");
                return;
            }

            console.log(singleBadge);


            const { data, error } = await supabase
                .from("Post")
                .select(`
          *,
          post_badges!inner(
            badges(id, name)
          )
        `)
                .eq("post_badges.badge_id", singleBadge.id)
                .order("created_at", { ascending: false });
            if (error) {
                console.error("Error fetching posts:", error);
                return;
            }
            console.log(tag);
            const postIds = data.map((post: Post) => post.id);
            const { data: comments, error: commentsError } = await supabase
                .from("Comments")
                .select("*")
                .in("post_id", postIds);

            if (commentsError) {
                console.error("Error fetching comments:", commentsError);
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

            const postsWithCommentsAndBadges = data.map((post: Post) => ({
                ...post,
                comments: comments.filter((comment: Comment) => comment.post_id === post.id),
                badges: postBadges
                    .filter((pb) => pb.post_id === post.id)
                    .map((pb) => badgeMap.get(pb.badge_id)),
            }));
            console.log(postsWithCommentsAndBadges)
            setPosts(postsWithCommentsAndBadges);

            console.log(badges);
        } catch(error){
            console.error("Error fetching data:", error);
        }

    }, [supabase]);

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

    useEffect(() => {
        fetchPosts();
        fetchUser();
    }, [fetchPosts, fetchUser]);

    useEffect(() => {
        fetchUserLikes();
    }, [fetchUserLikes]);

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
                    { user_id: user.id, user_name: user.username, post_id: postId },
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
            const addedComment = data[0];
            setPosts((prevPosts) =>
                prevPosts.map((post) =>
                    post.id === postId
                        ? { ...post, comments: [...post.comments, addedComment] }
                        : post
                )
            );
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
            setPosts((prevPosts) =>
                prevPosts.map((post) =>
                    post.id === postId
                        ? {
                            ...post,
                            comments: post.comments.filter(
                                (comment) => comment.id !== commentId
                            ),
                        }
                        : post
                )
            );
        }
    };

    return (
        <div
            className="flex flex-col gap-2 p-4 items-center "
            suppressHydrationWarning={true}
        >
            <div className="md:w-7/12 max-w-5xl">
                {posts.map((post) => (
                    <PostItem
                        key={post.id}
                        id={post.id}
                        title={post.title}
                        user_name={post.user_name}
                        user_avatar={post.user_avatar}
                        image_url={post.image_url}
                        content={post.content}
                        hashtags={post.hashtags}
                        likes={post.likes}
                        comments={post.comments}
                        badges={post.badges}
                        userHasLiked={userLikes.includes(post.id)}
                        onToggleLike={() => handleToggleLike(post.id)}
                        onComment={(commentContent) => handleComment(post.id, commentContent)}
                        onDeleteComment={(commentId) => handleDeleteComment(commentId, post.id)}
                        currentUser={user}
                        router={router}
                    />
                ))}
            </div>
        </div>
    );
}