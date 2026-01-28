import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaFacebook, FaLinkedin, FaInstagram, FaCalendar, FaClock, FaImage } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { postAPI } from "../api/post.api.js";
import PageSelector from "../components/PageSelector.jsx";

export default function CreatePost() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [caption, setCaption] = useState("");
  const [media, setMedia] = useState(null);
  const [mediaFile, setMediaFile] = useState(null);
  const [facebookActive, setFacebookActive] = useState(false);
  const [linkedinActive, setLinkedinActive] = useState(false);
  const [instagramActive, setInstagramActive] = useState(false);
  const [selectedPages, setSelectedPages] = useState({ facebook: null, instagram: null });
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Get user initials for profile picture
  const getInitials = () => {
    if (user?.username) {
      return user.username.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  // Handle media upload
  const handleMediaUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const previewURL = URL.createObjectURL(file);
      setMedia(previewURL);
      setMediaFile(file);
    }
  };

  // Handle drag and drop
  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      const previewURL = URL.createObjectURL(file);
      setMedia(previewURL);
      setMediaFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!caption.trim()) {
      setError("Please enter a caption");
      return;
    }

    if (caption.length > 2200) {
      setError("Caption must be 2200 characters or less");
      return;
    }

    const platforms = [];
    if (facebookActive) platforms.push("facebook");
    if (linkedinActive) platforms.push("linkedin");
    if (instagramActive) platforms.push("instagram");

    if (platforms.length === 0) {
      setError("Please select at least one platform");
      return;
    }

    if (!date || !time) {
      setError("Please select both date and time");
      return;
    }

    // Check if scheduled time is in the future
    const scheduledDateTime = new Date(`${date}T${time}`);
    if (scheduledDateTime <= new Date()) {
      setError("Scheduled date and time must be in the future");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("content", caption);
      formData.append("platforms", JSON.stringify(platforms));
      formData.append("scheduledDate", date);
      formData.append("scheduledTime", time);
      
      // Add selectedPages if any pages are selected
      if (selectedPages.facebook || selectedPages.instagram) {
        formData.append("selectedPages", JSON.stringify(selectedPages));
      }
      
      if (mediaFile) {
        formData.append("media", mediaFile);
      }

      const response = await fetch("http://localhost:4000/api/posts/create", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess("Post scheduled successfully!");
        // Clear form
        setCaption("");
        setMedia(null);
        setMediaFile(null);
        setFacebookActive(false);
        setLinkedinActive(false);
        setInstagramActive(false);
        setSelectedPages({ facebook: null, instagram: null });
        setDate("");
        setTime("");
        
        // Redirect to dashboard after 1.5 seconds
        setTimeout(() => {
          navigate("/dashboard");
        }, 1500);
      } else {
        setError(data.message || "Failed to schedule post");
      }
    } catch (err) {
      setError("Network error. Please try again.");
      console.error("Error creating post:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedPlatforms = [];
  if (facebookActive) selectedPlatforms.push("facebook");
  if (linkedinActive) selectedPlatforms.push("linkedin");
  if (instagramActive) selectedPlatforms.push("instagram");

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 sm:gap-6">
      {/* LEFT COLUMN - Editor */}
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-800">Create Post</h2>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Caption */}
          <div>
            <label className="block text-xs sm:text-sm font-medium mb-2 text-gray-700">
              Caption
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-800 text-white rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              rows="6"
              placeholder="Write your caption here..."
              maxLength={2200}
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-[10px] sm:text-xs text-gray-500">
                {caption.length} / 2200
              </p>
            </div>
          </div>

          {/* Media Upload */}
          <div>
            <label className="block text-xs sm:text-sm font-medium mb-2 text-gray-700">
              Media Upload
            </label>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => document.getElementById("mediaUploadInput").click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center cursor-pointer hover:border-blue-500 transition-colors min-h-[120px] sm:min-h-[150px] flex flex-col items-center justify-center"
            >
              <FaImage className="mx-auto text-2xl sm:text-3xl text-gray-400 mb-2" />
              <p className="text-xs sm:text-sm text-gray-600 mb-1">
                Click or drag & drop your image here
              </p>
              <p className="text-[10px] sm:text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
              
              {media && (
                <div className="mt-3 sm:mt-4 w-full">
                  <img
                    src={media}
                    alt="Preview"
                    className="max-h-32 sm:max-h-48 mx-auto rounded-lg object-cover w-full"
                  />
                  <p className="text-[10px] sm:text-xs text-gray-500 mt-2 truncate">
                    {mediaFile?.name || "Image preview"}
                  </p>
                </div>
              )}
            </div>
            <input
              id="mediaUploadInput"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleMediaUpload}
            />
          </div>

          {/* Platforms */}
          <div>
            <label className="block text-xs sm:text-sm font-medium mb-2 text-gray-700">
              Platforms
            </label>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setFacebookActive(!facebookActive)}
                className={`flex-1 min-w-[120px] px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors min-h-[44px] text-xs sm:text-sm ${
                  facebookActive
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                }`}
              >
                <FaFacebook />
                Facebook
              </button>
              <button
                type="button"
                onClick={() => setLinkedinActive(!linkedinActive)}
                className={`flex-1 min-w-[120px] px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors min-h-[44px] text-xs sm:text-sm ${
                  linkedinActive
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                }`}
              >
                <FaLinkedin />
                LinkedIn
              </button>
              <button
                type="button"
                onClick={() => setInstagramActive(!instagramActive)}
                className={`flex-1 min-w-[120px] px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors min-h-[44px] text-xs sm:text-sm ${
                  instagramActive
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                    : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                }`}
              >
                <FaInstagram />
                Instagram
              </button>
            </div>
          </div>

          {/* Page Selection for Facebook */}
          {facebookActive && (
            <PageSelector
              platform="facebook"
              value={selectedPages.facebook}
              onChange={(pageId) => setSelectedPages({ ...selectedPages, facebook: pageId })}
            />
          )}

          {/* Page Selection for Instagram */}
          {instagramActive && (
            <PageSelector
              platform="instagram"
              value={selectedPages.instagram}
              onChange={(accountId) => setSelectedPages({ ...selectedPages, instagram: accountId })}
            />
          )}

          {/* Scheduling */}
          <div>
            <label className="block text-xs sm:text-sm font-medium mb-2 text-gray-700">
              Scheduling
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              <div className="relative">
                <FaCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-9 sm:pl-10 pr-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-h-[44px]"
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div className="relative">
                <FaClock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full pl-9 sm:pl-10 pr-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-h-[44px]"
                />
              </div>
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm">
              {success}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-4 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] text-sm sm:text-base"
          >
            {isSubmitting ? "Scheduling..." : "Schedule Post"}
          </button>
        </form>
      </div>

      {/* RIGHT COLUMN - Preview */}
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-800">Preview</h2>

        {selectedPlatforms.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {selectedPlatforms.map((platform) => (
              <div
                key={platform}
                className={`w-full max-w-md mx-auto bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden ${
                  platform === 'instagram' ? 'border-pink-200' : ''
                }`}
              >
                {/* Platform-specific header */}
                <div className={`flex items-center gap-2 sm:gap-3 p-3 sm:p-4 border-b ${
                  platform === 'instagram' 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-pink-300' 
                    : 'border-gray-200'
                }`}>
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0 ${
                    platform === 'instagram'
                      ? 'bg-white text-pink-500'
                      : platform === 'facebook'
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-700 text-white'
                  }`}>
                    {platform === 'instagram' ? <FaInstagram /> : getInitials()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`font-semibold text-xs sm:text-sm truncate ${
                      platform === 'instagram' ? 'text-white' : 'text-gray-800'
                    }`}>
                      {platform === 'instagram' ? '@your_account' : user?.username || "Your Name"}
                    </p>
                    <p className={`text-[10px] sm:text-xs truncate ${
                      platform === 'instagram' ? 'text-white/80' : 'text-gray-500'
                    }`}>
                      Just now · <span className={platform === 'instagram' ? 'text-white' : 'text-blue-600'}>{platform}</span>
                    </p>
                  </div>
                </div>

                {/* Caption */}
                {caption && (
                  <div className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-800 whitespace-pre-wrap break-words">
                    {caption}
                  </div>
                )}

                {/* Media */}
                {media && (
                  <div className="w-full">
                    <img
                      src={media}
                      alt="Post media"
                      className="w-full h-auto object-cover"
                    />
                  </div>
                )}

                {/* Engagement section */}
                <div className="px-3 sm:px-4 py-2 sm:py-3 text-[10px] sm:text-xs text-gray-500 border-t border-gray-200">
                  👍 0 · ❤️ 0 · 😮 0
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8 sm:py-12">
            <FaFacebook className="mx-auto text-3xl sm:text-4xl mb-3 sm:mb-4 text-gray-300" />
            <p className="text-xs sm:text-sm">Select a platform to see preview</p>
          </div>
        )}
      </div>
    </div>
  );
}
