export type Post = {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar: string;
  title: string;
  image_url: string;
  content: string;
  hashtags: string[];
  likes: number;
  unlikes: number;
  comments: Comment[];
  badges: Badge[];
  created_at: string;
  fake_detection: boolean;
  source: string;
};

export type Comment = {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar: string;
  post_id: string;
  content: string;
  created_at: string;
  likes: number;
  unlikes: number;
  userHasLiked: boolean;
  userHasUnliked: boolean;
};

export type Badge = {
  id: string;
  name: string;
};

export type PostItemProps = {
  id: string;
  title: string;
  user_id?: string;
  user_name: string;
  user_avatar: string;
  image_url?: string;
  content: string;
  hashtags: string[];
  likes: number;
  unlikes: number;
  comments: Comment[];
  userHasLiked: boolean;
  userHasUnliked: boolean;
  onToggleLike?: () => void;
  onToggleUnlike?: () => void;
  onComment?: (commentContent: string) => void;
  onDeleteComment?: (commentId: string) => void;
  onToggleCommentLike?: (commentId: string) => void;
  onToggleCommentUnlike?: (commentId: string) => void;
  currentUser: any;
  badges: Badge[];
  router: any;
};

export type Profile = {
  id: string;
  username: string;
  created_at: string;
};
