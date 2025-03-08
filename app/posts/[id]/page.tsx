"use client";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import PostItem from "@/app/post/Post";
import { Post } from "@/components/types";

export default function PostsDynamic() {
  const params = useParams<{ id: string }>();
  const supabase = createClient();
  const [post, setPost] = useState<Post | null>(null);
  const [user, setUser] = useState<any>(null);
  const [userLikes, setUserLikes] = useState<string[]>([]);
  const [userUnlikes, setUserUnlikes] = useState<string[]>([]);
  const [userCommentLikes, setUserCommentLikes] = useState<string[]>([]);
  const [userCommentUnlikes, setUserCommentUnlikes] = useState<string[]>([]);
  const router = useRouter();

  const fetchPost = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("Post")
        .select("*")
        .eq("id", params.id)
        .single();

      if (error) {
        console.error("Error fetching post:", error);
        return;
      }

      const { data: likes, error: likesError } = await supabase
          .from("Likes")
          .select("*")
          .eq("post_id", data.id);

      if (likesError) {
        console.error("Error fetching likes:", likesError);
        return;
      }

      const { data: unlikes, error: unlikesError } = await supabase
          .from("Unlikes")
          .select("*")
          .eq("post_id", data.id);

      if (unlikesError) {
        console.error("Error fetching unlikes:", unlikesError);
        return;
      }

      const { data: comments, error: commentsError } = await supabase
        .from("Comments")
        .select("*")
        .eq("post_id", data.id);

      if (commentsError) {
        console.error("Error fetching comments:", commentsError);
        return;
      }

        // Get all comment IDs
        const commentIds = comments.map(comment => comment.id);

        // Fetch likes for all comments in a single query
        const { data: commentLikes, error: commentLikesError } = await supabase
            .from("LikesComments")
            .select("*")
            .in("comment_id", commentIds);

        if (commentLikesError) {
          console.error("Error fetching comment likes:", commentLikesError);
          return;
        }

        // Fetch dislikes for all comments in a single query
        const { data: commentUnlikes, error: commentUnlikesError } = await supabase
            .from("UnlikesComments")
            .select("*")
            .in("comment_id", commentIds);

        if (commentUnlikesError) {
          console.error("Error fetching comment unlikes:", commentUnlikesError);
          return;
        }

        // Now assign likes and unlikes counts to each comment
        const commentsWithLikes = comments.map(comment => {
          return {
            ...comment,
            likes: commentLikes.filter(like => like.comment_id === comment.id).length,
            unlikes: commentUnlikes.filter(unlike => unlike.comment_id === comment.id).length,
            userHasLiked: userCommentLikes.includes(comment.id),
            userHasUnliked: userCommentUnlikes.includes(comment.id)
          };
        });
      const { data: postBadges, error: postBadgesError } = await supabase
        .from("post_badges")
        .select("*")
        .eq("post_id", data.id);

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

      const postWithCommentsAndBadges = {
        ...data,
        comments: commentsWithLikes,
        badges: postBadges.map((pb) => badgeMap.get(pb.badge_id)),
        likes: likes.length,
        unlikes: unlikes.length,
      };

      setPost(postWithCommentsAndBadges);

      console.log(postWithCommentsAndBadges.comments);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }, [supabase, params.id]);

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

  useEffect(() => {
    fetchPost();
    fetchUser();
  }, [fetchPost, fetchUser]);

  useEffect(() => {
    fetchUserLikes();
    fetchUserUnlikes();
  }, [fetchUserLikes, fetchUserUnlikes]);

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
        setPost((prevPost) =>
          prevPost ? { ...prevPost, likes: prevPost.likes - 1 } : prevPost
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
        setPost((prevPost) =>
          prevPost ? { ...prevPost, likes: prevPost.likes + 1 } : prevPost
        );
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
        setPost((prevPost) =>
          prevPost ? { ...prevPost, unlikes: prevPost.unlikes - 1 } : prevPost
        );
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
        setPost((prevPost) =>
          prevPost ? { ...prevPost, unlikes: prevPost.unlikes + 1 } : prevPost
        );
      }
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
        fetchPost();
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
        fetchPost();

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
        fetchPost();
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
        fetchPost();

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
      setPost((prevPost) =>
        prevPost
          ? { ...prevPost, comments: [...prevPost.comments, addedComment] }
          : prevPost
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
      setPost((prevPost) =>
        prevPost
          ? {
              ...prevPost,
              comments: prevPost.comments.filter(
                (comment) => comment.id !== commentId
              ),
            }
          : prevPost
      );
    }
  };

  if (!post) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center" suppressHydrationWarning={true}>
      <div className="max-w-5xl p-2">
        <PostItem
          key={post.id}
          id={post.id}
          title={post.title}
          user_name={post.user_name}
          user_id={post.user_id}
          user_avatar={post.user_avatar}
          image_url={post.image_url}
          content={post.content}
          hashtags={post.hashtags}
          likes={post.likes}
          unlikes={post.unlikes} // Przekaż pole unlikes
          comments={post.comments}
          badges={post.badges}
          source={post.source}
          fake_detection={post.fake_detection}
          userHasLiked={userLikes.includes(post.id)}
          userHasUnliked={userUnlikes.includes(post.id)} // Przekaż stan unlikes
          onToggleLike={() => handleToggleLike(post.id)}
          onToggleUnlike={() => handleToggleUnlike(post.id)} // Przekaż funkcję handleToggleunlike
          onComment={(commentContent) => handleComment(post.id, commentContent)}
          onToggleCommentLike={(commentId) =>
              handleToggleCommentLike(commentId)
          }
          onToggleCommentUnlike={(commentId) =>
              handleToggleCommentUnlike(commentId)
          }
          onDeleteComment={(commentId) =>
            handleDeleteComment(commentId, post.id)
          }
          currentUser={user}
          router={router}
        />
      </div>
    </div>
  );
}
