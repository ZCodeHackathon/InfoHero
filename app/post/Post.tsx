import { FC, useState } from "react";
import { useTheme } from "next-themes";
import { Badge } from "@/components/ui/badge";
import FavoriteIcon from "@mui/icons-material/Favorite";
import Collapse from "@mui/material/Collapse";
import Avatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { red } from "@mui/material/colors";
import AddCommentIcon from "@mui/icons-material/AddComment";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar"; // Import ikony unlike

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
  image_url?: string;
  content: string;
  hashtags: string[];
  likes: number;
  unlikes: number; // Dodaj pole unlikes
  comments: Comment[];
  userHasLiked: boolean;
  userHasUnliked: boolean; // Dodaj pole userHasUnliked
  onToggleLike: () => void;
  onToggleUnlike: () => void; // Dodaj funkcję onToggleUnlike
  onComment: (commentContent: string) => void;
  onDeleteComment: (commentId: string) => void;
  currentUser: any;
  badges: Badge[];
  router: any;
};

const PostItem: FC<PostItemProps> = ({
  id,
  title,
  user_name,
  user_avatar,
  image_url,
  content,
  hashtags,
  likes,
  unlikes, // Dodaj pole unlikes
  comments,
  userHasLiked,
  userHasUnliked, // Dodaj pole userHasUnliked
  onToggleLike,
  onToggleUnlike, // Dodaj funkcję onToggleUnlike
  onComment,
  onDeleteComment,
  currentUser,
  badges,
  router,
}) => {
  const { theme } = useTheme();
  const [commentText, setCommentText] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [alert, setAlert] = useState<{ open: boolean, severity: 'success' | 'error', message: string }>({
    open: false,
    severity: 'success',
    message: ''
  });
  const handleLikeClick = () => {
    onToggleLike();
  };

  const handleUnlikeClick = () => {
    onToggleUnlike();
  };
  const handleAlertClose = () => {
    setAlert({...alert, open: false});
  };
  const handleCommentSubmit = () => {
    if (commentText.trim() !== "") {
      onComment(commentText);
      setAlert({open: true, severity: 'success', message: 'Dodano komentarz!'});
      setCommentText("");
    }
  };

  const confirmDeleteComment = (commentId: string) => {
    if (confirm("Czy na pewno chcesz usunąć komentarz?")) {
      onDeleteComment(commentId);
      setAlert({open: true, severity: 'success', message: 'Usunięto komentarz!'});
    }
  };

  // Funkcja do przekierowania na profil użytkownika
  const goToUserProfile = (userId: string) => {
    router.push(`/profile/${userId}`); // Przekierowanie do profilu użytkownika
  };

  return (
    <div
      key={id}
      className={`p-2 rounded-md shadow-lg border ${theme === "dark" ? "bg-black text-white" : "bg-white text-black"}`}
    >
      <div className="flex items-start">
        <Avatar
          src={user_avatar}
          sx={{ bgcolor: red[500], marginRight: 2 }}
          onClick={() => goToUserProfile(user_avatar)} // Kliknięcie na avatar
          style={{ cursor: "pointer" }}
        >
          {user_name.charAt(0)}
        </Avatar>
        <div className="truncate">
          <p
            className="text-sm text-gray-500 cursor-pointer"
            onClick={() => goToUserProfile(user_avatar)} // Kliknięcie na nazwisko
          >
            Posted by {user_name}
          </p>
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

      <p className="mt-2 truncate">{content}</p>

      <div className="flex flex-row justify-between items-center mt-2">
        <div className="flex space-x-2">
          <p className="text-green-500"> {likes > 0 ? `+${likes}` : likes}</p>
          <p className="text-red-500">
            {unlikes > 0 ? `-${unlikes}` : unlikes}
          </p>
        </div>
        <p>{comments.length} Comments</p>
      </div>

      <div className="flex items-center mt-2">
        <ThumbsUp
          style={{ color: userHasLiked ? "green" : "grey", fontSize: 32 }}
          onClick={handleLikeClick}
        />
        <ThumbsDown
          style={{ color: userHasUnliked ? "red" : "grey", fontSize: 32 }}
          onClick={handleUnlikeClick}
        />
        <Input
          type="text"
          placeholder="Write a comment..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-md ml-4"
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
      <Snackbar open={alert.open} autoHideDuration={6000} onClose={handleAlertClose}>
        <Alert onClose={handleAlertClose} severity={alert.severity} sx={{width: '100%'}}>
          {alert.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default PostItem;
