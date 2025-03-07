"use client";

import { createClient } from "@/utils/supabase/client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Select from "react-select";

type Badge = {
    id: string;
    name: string;
}
export default function AddPost() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null); // State for the user
  const [badges, setBadges] = useState<Badge[]>([]);
  const [selectedBadges, setSelectedBadges] = useState<Badge[]>([]);
  const [badgeOptions, setBadgeOptions] = useState<{ value: string; label: string }[]>([]);
  const supabase = createClient();
  const router = useRouter();
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
    }
  };
  const fetchBadges = async () => {
    const { data: badges, error } = await supabase.from('badges').select('*');
    if (error) {
      console.error('Error fetching badges:', error);
      return;
    }
    setBadges(badges);
    const options = badges.map((badge) => ({
      value: badge.id,
      label: badge.name
    }));
    setBadgeOptions(options);
  }
  useEffect(() => {
    fetchUser();
    fetchBadges();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      // If user is not logged in, redirect to sign-in page
      router.push("/sign-in");
      return;
    }

    if (!title || !content || !selectedBadges) {
      alert("All fields are required!");
      return;
    }

    setLoading(true);

    // Split hashtags into an array
    const hashtagArray = hashtags.split(",").map((hashtag) => hashtag.trim());

    const { data, error } = await supabase.from('Post').insert([{
        title,
        content,
        image_url: imageUrl || null, // Jeśli pusty, wstawiamy null
        hashtags: hashtagArray,
        likes: 0,  
        comments: [],  
        user_id: user.id,  
        user_name: user.username  
      }]).select("id").single();

    if (error) {
      console.error("Error adding post:", error);
      alert("There was an error adding your post.");
      return;
    }
    alert("Post added successfully!");

    const postBadges = selectedBadges.map((badge) => ({
        post_id: data.id,
        badge_id: badge.value
      }));

    const { pbError } = await supabase.from('post_badges').insert(
       postBadges
      );
    if (pbError) {
      console.error("Error adding post badges:", error);
      alert("There was an error adding your post.");
      return;
    }
    router.push('/'); // Redirect to homepage after posting
    setLoading(false);
  };

  return (
    <div className="bg-black p-4 rounded-md shadow-lg w-full max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-4">Add New Post</h1>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="title" className="text-white">
            Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full mt-1 p-3 bg-gray-800 text-white border border-gray-600 rounded-md"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="content" className="text-white">
            Content
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            className="w-full mt-1 p-3 bg-gray-800 text-white border border-gray-600 rounded-md"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="imageUrl" className="text-white">
            Image URL
          </label>
          <input
            type="url"
            id="imageUrl"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            
            className="w-full mt-1 p-3 bg-gray-800 text-white border border-gray-600 rounded-md"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="hashtags" className="text-white">Hashtags (comma separated)</label>
          <Select
              isMulti
              value={selectedBadges}
              options={badgeOptions}
              onChange={setSelectedBadges}
              className="w-full mt-1 p-3 bg-gray-800 text-black border border-gray-600 rounded-md"
              required
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? "Adding..." : "Add Post"}
          </button>
        </div>
      </form>
    </div>
  );
}
