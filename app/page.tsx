"use client";

import { createClient } from "@/utils/supabase/client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import PostItem from "./post/Post";
import { Post } from "@/components/types";

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [user, setUser] = useState<any>(null);
  const [userLikes, setUserLikes] = useState<string[]>([]);
  const [userUnlikes, setUserUnlikes] = useState<string[]>([]);
  const [userCommentLikes, setUserCommentLikes] = useState<string[]>([]);
  const [userCommentUnlikes, setUserCommentUnlikes] = useState<string[]>([]);
  const supabase = createClient();
  const router = useRouter();

  const fetchPosts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("Post")
        .select("*")
        .order("created_at", { ascending: false });

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
      console.log(postsWithCommentsAndBadges);
      setPosts(postsWithCommentsAndBadges);

      console.log(badges);
    } catch (error) {
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

  // Add these to your useEffect
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
  }, [fetchPosts, fetchUser]);

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

    const hasUnliked = userCommentUnlikes.includes(commentId);

    if (hasUnliked) {
      const { error } = await supabase
        .from("UnlikesComments")
        .delete()
        .eq("user_id", user.id)
        .eq("comment_id", commentId);

      if (error) {
        console.error("Error removing unlike from comment:", error);
      } else {
        setUserCommentUnlikes((prevUnlikes) =>
          prevUnlikes.filter((id) => id !== commentId)
        );
        fetchPosts(); // Fetch updated posts
      }
    } else {
      const { error } = await supabase
        .from("UnlikesComments")
        .insert([
          { user_id: user.id, user_name: user.username, comment_id: commentId },
        ]);

      if (error) {
        console.error("Error unliking comment:", error);
      } else {
        setUserCommentUnlikes((prevUnlikes) => [...prevUnlikes, commentId]);
        fetchPosts(); // Fetch updated posts
      }
    }
  };

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

  return (
    <div className="flex flex-col items-center" suppressHydrationWarning={true}>
      <div className="max-w-5xl flex flex-wrap items-top justify-center">
        {posts.map((post) => (
          <div className="w-full sm:w-1/2 md:w-1/3 max-w-xs p-2" key={post.id}>
            <PostItem
              key={post.id}
              id={post.id}
              title={post.title}
              user_name={post.user_name}
              user_avatar={post.user_avatar}
              image_url={post.image_url}
              content={post.content}
              hashtags={post.hashtags}
              unlikes={post.unlikes}
              likes={post.likes}
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
              currentUser={user}
              router={router}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
