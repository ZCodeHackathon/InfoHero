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
    onComment,
    onDeleteComment,
    currentUser,
    badges,
    router,
}) => {
    const { theme } = useTheme();
    const [commentText, setCommentText] = useState("");
    const [expanded, setExpanded] = useState(false);
    const [commentUserProfiles, setCommentUserProfiles] = useState<{ [key: string]: { avatar_url: string } }>({});
    const [userProfile, setUserProfile] = useState<{ avatar_url: string } | null>(null);

    const supabase = createClient();

    const handleLikeClick = () => {
        onToggleLike();
    };

    const handleUnlikeClick = () => {
        onToggleUnlike();
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
                if (error.code === 'PGRST116') {
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

    
    return (
        <div
            key={id}
            className={`p-2 rounded-md shadow-lg border ${theme === "dark" ? "bg-black text-white" : "bg-white text-black"}`}
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
                        onError={(e) => { e.currentTarget.src = '/default-avatar.png'; }} // Ustawienie domyślnego avatara w przypadku błędu
                    />
                ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-300" />
                )}
                <div className="truncate">
                    <p
                        className="text-sm text-gray-500 cursor-pointer"
                        onClick={() => goToUserProfile(user_id)}
                    >
                        Posted by {user_name}
                    </p>
                    <h2 className="text-xl font-bold">{title}</h2>
                </div>
            </div>

            {/* Inne elementy posta */}
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
                <ExpandMoreIcon sx={{ color: theme === "dark" ? "white" : "default" }} />
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
                                    onError={(e) => { e.currentTarget.src = '/default-avatar.png'; }} // Ustawienie domyślnego avatara w przypadku błędu
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