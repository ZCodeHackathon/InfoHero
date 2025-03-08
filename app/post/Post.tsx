import { FC, useState, useCallback, useEffect } from "react";
import { useTheme } from "next-themes";
import { Badge } from "@/components/ui/badge";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AddCommentIcon from "@mui/icons-material/AddComment";
import { Input } from "@/components/ui/input";
import { ThumbsDown, ThumbsUp } from "lucide-react"; // Import ikony unlike
import { createClient } from "@/utils/supabase/client";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import SmartToyOutlinedIcon from "@mui/icons-material/SmartToyOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Comment = {
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

type Badge = {
  id: string;
  name: string;
};

type PostItemProps = {
  id: string;
  title: string;
  user_name: string;
  user_id: string;
  avatar_url?: string; // Dodaj avatar_url
  image_url?: string;
  content: string;
  hashtags: string[];
  likes: number;
  unlikes: number;
  comments: Comment[];
  userHasLiked: boolean;
  userHasUnliked: boolean;
  onToggleLike: () => void;
  onToggleUnlike: () => void;
  onToggleCommentLike: (commentId: string) => void;
  onToggleCommentUnlike: (commentId: string) => void;
  onComment: (commentContent: string) => void;
  onDeleteComment: (commentId: string) => void;
  currentUser: any;
  badges: Badge[];
  router: any;
  fake_detection: boolean;
  source: string;
};

const PostItem: FC<PostItemProps> = ({
  id,
  title,
  user_name,
  user_id,
  avatar_url, // Dodaj avatar_url
  image_url,
  content,
  hashtags,
  likes,
  unlikes,
  comments,
  userHasLiked,
  userHasUnliked,
  onToggleLike,
  onToggleUnlike,
  onToggleCommentLike,
  onToggleCommentUnlike,
  onComment,
  onDeleteComment,
  currentUser,
  badges,
  router,
  fake_detection,
  source,
}) => {
  const { theme } = useTheme();
  const [commentText, setCommentText] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [commentUserProfiles, setCommentUserProfiles] = useState<{
    [key: string]: { avatar_url: string };
  }>({});
  const [userProfile, setUserProfile] = useState<{ avatar_url: string } | null>(
    null
  );

  const supabase = createClient();
  const [alert, setAlert] = useState<{
    open: boolean;
    severity: "success" | "error";
    message: string;
  }>({
    open: false,
    severity: "success",
    message: "",
  });

  const handleLikeClick = () => {
    if (onToggleLike) {
      onToggleLike();
    }
  };

  const handleUnlikeClick = () => {
    if (onToggleUnlike) {
      onToggleUnlike();
    }
  };

  const handleAlertClose = () => {
    setAlert({ ...alert, open: false });
  };

  const handleCommentSubmit = () => {
    if (commentText.trim() !== "") {
      if (onComment) {
        onComment(commentText);
      }
      setAlert({
        open: true,
        severity: "success",
        message: "Dodano komentarz!",
      });
      setCommentText("");
    }
  };

  const confirmDeleteComment = (commentId: string) => {
    if (confirm("Czy na pewno chcesz usunąć komentarz?")) {
      if (onDeleteComment) {
        onDeleteComment(commentId);
      }
      setAlert({
        open: true,
        severity: "success",
        message: "Usunięto komentarz!",
      });
    }
  };

  const goToUserProfile = (userId: string) => {
    router.push(`/profile/${userId}`);
  };

  // Fetch profile function for post author
  const fetchProfile = useCallback(async () => {
    if (!user_id) {
      console.error("user_id is undefined");
      return;
    }
    try {
      console.log("Fetching profile for user ID:", user_id); // Logowanie user_id przed zapytaniem

      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, avatar_url") // Pobranie wszystkich trzech pól
        .eq("id", user_id) // Filtrowanie po user_id
        .single(); // Oczekujemy tylko jeden wynik

      if (error) {
        console.error("Error loading profile:", error);
        if (error.code === "PGRST116") {
          console.log("No profile found for the provided user ID");
        } else {
          router.push("/"); // Jeśli błąd jest poważniejszy, przekieruj na stronę główną
        }
      } else {
        console.log("Fetched Profile Data: ", data); // Logowanie całego obiektu profilu
        setUserProfile(data); // Przechowaj pobrane dane w stanie
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
  }, [user_id, router, supabase]);

  // Fetch comment authors' avatars
  const fetchCommentProfiles = useCallback(async () => {
    try {
      const commentUserIds = comments.map((comment) => comment.user_id);
      console.log("Fetching profiles for comment user IDs:", commentUserIds);
      const { data, error } = await supabase
        .from("profiles")
        .select("id, avatar_url")
        .in("id", commentUserIds); // Fetch all profiles of users who commented

      if (error) {
        console.error("Błąd ładowania profili komentujących:", error);
      } else {
        const profiles = data.reduce((acc: any, profile: any) => {
          acc[profile.id] = profile;
          return acc;
        }, {});
        setCommentUserProfiles(profiles); // Store comment authors' profile data
        console.log("Fetched comment user profiles:", profiles);
      }
    } catch (error) {
      console.error("Błąd podczas ładowania profili komentujących:", error);
    }
  }, [comments, supabase]);

  useEffect(() => {
    fetchProfile(); // Fetch post author's profile on mount
    fetchCommentProfiles(); // Fetch comment authors' profiles on mount
  }, [fetchProfile, fetchCommentProfiles]);

  console.log("Rendering PostItem with avatar_url:", userProfile?.avatar_url);
  {
    console.log(fake_detection);
  }
  {
    console.log(source);
  }

  return (
    <div>
      <div
        className={`text-sm font-bold rounded-md p-2 ${source !== null ? "text-green-500" : "text-red-500"}`}
        style={{ width: "12%", textAlign: "right", float: "right" }}
      >
        {source !== null ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <MenuBookOutlinedIcon />
              </TooltipTrigger>
              <TooltipContent>
                <p>Podane zostały źródła</p>
                {source && (
                  <a
                    href={source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 underline"
                  >
                    Zobacz źródło
                  </a>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <MenuBookOutlinedIcon />
              </TooltipTrigger>
              <TooltipContent>
                <p>Źródła nie zostały podane</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <div
        className={`text-sm font-bold rounded-md p-2 ${fake_detection === true ? "text-red-500" : "text-green-500"}`}
        style={{ width: "12%", textAlign: "right", float: "right" }}
      >
        {fake_detection === true ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <SmartToyOutlinedIcon />
              </TooltipTrigger>
              <TooltipContent>
                <p>Fake news wedug AI</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <SmartToyOutlinedIcon />
              </TooltipTrigger>
              <TooltipContent>
                <p>Prawda uznana przez AI</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      <div
        key={id}
        className={`p-2 rounded-md shadow-lg border ${
          theme === "dark" ? "bg-black text-white" : "bg-white text-black"
        } ${
          source === null && fake_detection === true
            ? "border-red-500 border-2 bg-red-100"
            : "border-gray-200"
        }`}
      >
        <div className="flex items-start">
          {/* Avatar użytkownika */}
          {userProfile?.avatar_url ? (
            <img
              src={userProfile.avatar_url}
              alt={avatar_url}
              className="w-10 h-10 rounded-full"
              onClick={() => goToUserProfile(user_id)} // Kliknięcie przenosi do profilu
              style={{ cursor: "pointer" }} // Dodajemy kursor wskazujący, że element jest klikalny
              onError={(e) => {
                e.currentTarget.src = "/default-avatar.png";
              }} // Ustawienie domyślnego avatara w przypadku błędu
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-300" />
          )}
          <div className="w-full">
            <p
              className="text-sm text-gray-500 cursor-pointer"
              onClick={() => goToUserProfile(user_id)}
            >
              Posted by {user_name}
            </p>
            <h2
              className="text-xl font-bold break-words cursor-pointer hover:text-blue-500 transition-colors"
              onClick={() => router.push(`/posts/${id}`)}
            >
              {title}
            </h2>
          </div>
        </div>

        {/* Inne elementy posta */}
        <div className="flex flex-wrap gap-2">
          {badges.map((badge) => (
            <Badge
              key={badge.id}
              className="cursor-pointer"
              style={{ backgroundColor: badge.color }} // Dynamicznie przypisujemy kolor
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

        {/* Lajki i komentarze */}
        <div className="flex flex-row justify-between items-center mt-2">
          <div className="flex space-x-2">
            <p className="text-green-500">{likes > 0 ? `+${likes}` : likes}</p>
            <p className="text-red-500">
              {unlikes > 0 ? `-${unlikes}` : unlikes}
            </p>
          </div>
          <p>{comments.length} Comments</p>
        </div>

        {/* Lajki, unliki, komentarze */}
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
                {/* Wyświetlamy avatar komentującego */}
                {commentUserProfiles[comment.user_id]?.avatar_url ? (
                  <img
                    src={commentUserProfiles[comment.user_id]?.avatar_url}
                    alt={comment.user_name}
                    className="w-8 h-8 rounded-full mr-2"
                    onError={(e) => {
                      e.currentTarget.src = "/default-avatar.png";
                    }} // Ustawienie domyślnego avatara w przypadku błędu
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-300 mr-2" />
                )}
                <div>
                  <p className="text-sm text-gray-500">
                    {comment.user_name} -{" "}
                    {new Date(comment.created_at).toLocaleString()}
                  </p>
                  <p>{comment.content}</p>
                  <div className="flex items-center mt-2 space-x-4">
                    <div className="flex items-center">
                      <ThumbsUp
                        className="cursor-pointer hover:scale-110 transition-transform"
                        size={24}
                        style={{
                          color: comment.userHasLiked ? "green" : "grey",
                          transition: "color 0.2s ease",
                        }}
                        onClick={() => onToggleCommentLike(comment.id)}
                      />
                      <span className="ml-2 text-green-500">
                        {comment.likes > 0
                          ? `+${comment.likes}`
                          : comment.likes}
                      </span>
                    </div>

                    <div className="flex items-center">
                      <ThumbsDown
                        className="cursor-pointer hover:scale-110 transition-transform"
                        size={24}
                        style={{
                          color: comment.userHasUnliked ? "red" : "grey",
                          transition: "color 0.2s ease",
                        }}
                        onClick={() => onToggleCommentUnlike(comment.id)}
                      />
                      <span className="ml-2 text-red-500">
                        {comment.unlikes > 0
                          ? `-${comment.unlikes}`
                          : comment.unlikes}
                      </span>
                    </div>
                  </div>
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
        <Snackbar
          open={alert.open}
          autoHideDuration={6000}
          onClose={handleAlertClose}
        >
          <Alert
            onClose={handleAlertClose}
            severity={alert.severity}
            sx={{ width: "100%" }}
          >
            {alert.message}
          </Alert>
        </Snackbar>
      </div>
    </div>
  );
};

export default PostItem;
