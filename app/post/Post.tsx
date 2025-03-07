import { FC, useState } from "react";
import { useTheme } from "next-themes";
import { Badge } from "@/components/ui/badge";
import FavoriteIcon from "@mui/icons-material/Favorite";
import Collapse from "@mui/material/Collapse";
import Avatar from "@mui/material/Avatar";
import IconButton, { IconButtonProps } from "@mui/material/IconButton";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { styled } from "@mui/material/styles";
import { red } from "@mui/material/colors";
import AddCommentIcon from "@mui/icons-material/AddComment";

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

type PostItemProps = {
  id: string;
  title: string;
  user_name: string;
  user_avatar: string;
  image_url?: string; // Teraz obraz jest opcjonalny
  content: string;
  hashtags: string[];
  likes: number;
  comments: Comment[];
  userHasLiked: boolean;
  onToggleLike: () => void;
  onComment: (commentContent: string) => void;
  onDeleteComment: (commentId: string) => void;
  currentUser: any;
  badges: Badge[];
  router: any;
};

const ExpandMore = styled((props: IconButtonProps & { expand: boolean }) => {
  const { expand, ...other } = props;
  return <IconButton {...other} />;
})(({ theme }) => ({
  marginLeft: "auto",
  transition: theme.transitions.create("transform", {
    duration: theme.transitions.duration.shortest,
  }),
  transform: (props) => (props.expand ? "rotate(180deg)" : "rotate(0deg)"),
}));

const PostItem: FC<PostItemProps> = ({
  id,
  title,
  user_name,
  user_avatar,
  image_url,
  content,
  hashtags,
  likes,
  comments,
  userHasLiked,
  onToggleLike,
  onComment,
  onDeleteComment,
  currentUser,
  badges,
  router,
}) => {
  const { theme } = useTheme();
  const [hasLiked, setHasLiked] = useState(userHasLiked);
  const [commentText, setCommentText] = useState("");
  const [expanded, setExpanded] = useState(false);

  const handleLikeClick = () => {
    onToggleLike();
    setHasLiked(!hasLiked);
  };

  const handleCommentSubmit = () => {
    if (commentText.trim() !== "") {
      onComment(commentText);
      setCommentText("");
    }
  };

  const confirmDeleteComment = (commentId: string) => {
    if (confirm("Are you sure you want to delete this comment?")) {
      onDeleteComment(commentId);
    }
  };

  return (
    <div
      key={id}
      className={`p-4 mt-2 rounded-md shadow-lg border  ${theme === "dark" ? "bg-black text-white" : "bg-white text-black"}`}
    >
      <div className="flex items-center">
        <Avatar src={user_avatar} sx={{ bgcolor: red[500], marginRight: 2 }}>
          {user_name.charAt(0)}
        </Avatar>
        <div>
          <p className="text-sm text-gray-500">Posted by {user_name}</p>
          <h2 className="text-xl font-bold">{title}</h2>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {badges.map((badge) => (
          <Badge
            key={badge.id}
            className="bg-violet-400 cursor-pointer"
            onClick={() => router.push(`/tag/${badge.name}`)}
          >
            {badge.name}
          </Badge>
        ))}
      </div>

      {image_url && (
        <div className="relative">
          <img src={image_url} alt={title} className="w-full rounded-t-xl" />
        </div>
      )}

      <p className="text-gray-700 mt-2">{content}</p>

      <div className="flex flex-row justify-between items-center mt-2">
        <p>{likes} Likes</p>
        <p>{comments.length} Comments</p>
      </div>

      <div className="flex items-center mt-2">
        <FavoriteIcon
          style={{ color: hasLiked ? "red" : "grey", fontSize: 32 }}
          onClick={handleLikeClick}
        />
        <input
          type="text"
          placeholder="Write a comment..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          className="px-4 py-2 border rounded-md ml-4"
        />
        <AddCommentIcon
          style={{ color: "grey", fontSize: 32 }}
          onClick={handleCommentSubmit}
          className="ml-2"
        />
      </div>

      <IconButton
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <ExpandMoreIcon
          sx={{ color: theme === "dark" ? "white" : "default" }}
        />
      </IconButton>

      <Collapse in={expanded} timeout="auto" unmountOnExit>
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="border-t pt-2 mt-2 flex justify-between items-center"
          >
            <div className="flex items-center">
              <Avatar
                src={comment.user_avatar}
                sx={{ bgcolor: red[500], marginRight: 2 }}
              >
                {comment.user_name.charAt(0)}
              </Avatar>
              <div>
                <p className="text-sm text-gray-500">
                  {comment.user_name} -{" "}
                  {new Date(comment.created_at).toLocaleString()}
                </p>
                <p>{comment.content}</p>
              </div>
            </div>
            {currentUser?.id === comment.user_id && (
              <button
                onClick={() => confirmDeleteComment(comment.id)}
                className="text-red-500 text-sm"
              >
                Delete
              </button>
            )}
          </div>
        ))}
      </Collapse>
    </div>
  );
};

export default PostItem;
