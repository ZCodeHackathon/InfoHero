"use client";

import { createClient } from "@/utils/supabase/client";
import { useState, useEffect } from "react";
import { redirect, useRouter } from "next/navigation";
import Select from "react-select";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import { useTheme } from "next-themes";

type Badge = {
  id: string;
  name: string;
};

export default function AddPost() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null); // State for the user
  const [badges, setBadges] = useState<Badge[]>([]);
  const [selectedBadges, setSelectedBadges] = useState<Badge[]>([]);
  const [badgeOptions, setBadgeOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [isVerified, setIsVerified] = useState(false);
  const [alert, setAlert] = useState<{
    open: boolean;
    severity: "success" | "error";
    message: string;
  }>({
    open: false,
    severity: "success",
    message: "",
  });
  const [isFake, setIsFake] = useState(false);
  const supabase = createClient();
  const router = useRouter();
  const { theme } = useTheme();

  const handleAlertClose = () => {
    setAlert({ ...alert, open: false });
  };
  // Fetch the user information
  const fetchUser = async () => {
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
    } else {
      return redirect("/sign-in");
    }
  };
  const fetchBadges = async () => {
    const { data: badges, error } = await supabase.from("badges").select("*");
    if (error) {
      console.error("Error fetching badges:", error);
      return;
    }
    setBadges(badges);
    const options = badges.map((badge) => ({
      value: badge.id,
      label: badge.name,
    }));
    setBadgeOptions(options);
  };
  useEffect(() => {
    fetchUser();
    fetchBadges();
  }, []);

  const verifyWithAI = async () => {
    if (content) {
      try {
        const response = await fetch("http://localhost:5000/classify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: title + ". " + content,
            type: "hate_speech",
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Error fetching data");
        }

        console.log("Predicted class:", data.predicted_class);

        if (data.predicted_class) {
          //       alert("This post contains hate speech!");
          setAlert({
            open: true,
            severity: "error",
            message: "Ten post zawiera mowę nienawiści!",
          });

          setIsVerified(false);
          return;
        }
      } catch (error) {
        console.error("Error:", error);
      }
      try {
        const response = await fetch("http://localhost:5000/classify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: title + ". " + content,
            type: "fake_news",
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Error fetching data");
        }

        console.log("Predicted class:", data.predicted_class);
        if (data.predicted_class) {
          setIsFake(true);
        }

        //  setAlert({open: true, severity: 'success', message: 'Post verified successfully!'});
        setIsVerified(true);
      } catch (error) {
        console.error("Error:", error);
      }
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      // If user is not logged in, redirect to sign-in page
      router.push("/sign-in");
      return;
    }

    setLoading(true);
    await verifyWithAI();
    // Split hashtags into an array
    if (!isVerified) {
      setLoading(false);
      return;
    }
    const hashtagArray = hashtags.split(",").map((hashtag) => hashtag.trim());

    const { data, error } = await supabase
      .from("Post")
      .insert([
        {
          title,
          content,
          image_url: imageUrl || null, // Jeśli pusty, wstawiamy null
          hashtags: hashtagArray,
          likes: 0,
          comments: [],
          user_id: user.id,
          user_name: user.username,
          fake_detection: isFake,
          source: source || null,
        },
      ])
      .select("id")
      .single();

    if (error) {
      console.error("Error adding post:", error);
      //   alert("There was an error adding your post.");
      setAlert({
        open: true,
        severity: "error",
        message: "Wystąpił błąd przy dodawaniu posta!",
      });

      return;
    }
    // alert("Post added successfully!");
    setAlert({
      open: true,
      severity: "success",
      message: "Pomyślnie dodano post!",
    });

    const postBadges = selectedBadges.map((badge) => ({
      post_id: data.id,
      badge_id: badge.value,
    }));

    const { pbError } = await supabase.from("post_badges").insert(postBadges);
    if (pbError) {
      console.error("Error adding post badges:", error);
      setAlert({
        open: true,
        severity: "error",
        message: "Wystąpił błąd przy dodawaniu posta!",
      });

      //alert("There was an error adding your post.");
      return;
    }
    router.push("/"); // Redirect to homepage after posting
    setLoading(false);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setIsVerified(false); // Reset verification status on title change
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setIsVerified(false); // Reset verification status on content change
  };
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // Użytkownik nie jest zalogowany, przekieruj natychmiast
        router.push("/sign-in");
        return;
      }
    };
    checkAuth();
  }, [router]);

  return (
    <>
      {user && (
        <div
          className={`p-4 rounded-md shadow-lg w-full max-w-xl mx-auto ${
            theme === "dark" ? "bg-black text-white" : "bg-white text-black"
          }`}
        >
          <h1
            className={`text-2xl font-bold mb-4 ${
              theme === "dark" ? "text-white" : "text-black"
            }`}
          >
            Dodaj nowy post
          </h1>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="title"
                className={theme === "dark" ? "text-white" : "text-black"}
              >
                Tytuł
              </label>
              <input
                type="text"
                id="title"
                value={title}
                maxLength={50}
                onChange={handleTitleChange}
                required
                className={`w-full mt-1 p-3 border rounded-md ${
                  theme === "dark"
                    ? "bg-gray-800 text-white border-gray-600"
                    : "bg-gray-100 text-black border-gray-300"
                }`}
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="content"
                className={theme === "dark" ? "text-white" : "text-black"}
              >
                Treść
              </label>
              <textarea
                id="content"
                value={content}
                onChange={handleContentChange}
                required
                className={`w-full mt-1 p-3 border rounded-md ${
                  theme === "dark"
                    ? "bg-gray-800 text-white border-gray-600"
                    : "bg-gray-100 text-black border-gray-300"
                }`}
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="imageUrl"
                className={theme === "dark" ? "text-white" : "text-black"}
              >
                URL obrazka
              </label>
              <input
                type="url"
                id="imageUrl"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className={`w-full mt-1 p-3 border rounded-md ${
                  theme === "dark"
                    ? "bg-gray-800 text-white border-gray-600"
                    : "bg-gray-100 text-black border-gray-300"
                }`}
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="sourceUrl"
                className={theme === "dark" ? "text-white" : "text-black"}
              >
                Źródło
              </label>
              <input
                type="url"
                id="sourceUrl"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className={`w-full mt-1 p-3 border rounded-md ${
                  theme === "dark"
                    ? "bg-gray-800 text-white border-gray-600"
                    : "bg-gray-100 text-black border-gray-300"
                }`}
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="hashtags"
                className={theme === "dark" ? "text-white" : "text-black"}
              >
                Tagi
              </label>
              <Select
                isMulti
                value={selectedBadges}
                options={badgeOptions}
                placeholder={"Wybierz tagi"}
                onChange={setSelectedBadges}
                className={`w-full mt-1 p-3 border rounded-md ${
                  theme === "dark" ? "bg-gray-800" : "bg-gray-100"
                }`}
                styles={{
                  control: (base) => ({
                    ...base,
                    background: theme === "dark" ? "#1f2937" : "#f3f4f6",
                    borderColor: theme === "dark" ? "#4b5563" : "#d1d5db",
                  }),
                  menu: (base) => ({
                    ...base,
                    background: theme === "dark" ? "#1f2937" : "#ffffff",
                  }),
                  option: (base, state) => ({
                    ...base,
                    background: state.isFocused
                      ? theme === "dark"
                        ? "#374151"
                        : "#e5e7eb"
                      : "transparent",
                    color: theme === "dark" ? "#ffffff" : "#000000",
                  }),
                }}
                required
                maxMenuHeight={200}
                isOptionDisabled={() => selectedBadges.length >= 3}
              />
            </div>

            <div className="mb-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? "Dodawanie..." : "Dodaj post"}
              </button>
            </div>
          </form>
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
      )}
    </>
  );
}
