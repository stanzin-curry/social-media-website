import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaFacebook, FaLinkedin, FaInstagram, FaCalendar, FaClock, FaImage, FaTimes, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { postAPI } from "../api/post.api.js";
import PageSelector from "../components/PageSelector.jsx";

export default function CreatePost() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [caption, setCaption] = useState("");
  const [media, setMedia] = useState([]);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [facebookActive, setFacebookActive] = useState(false);
  const [linkedinActive, setLinkedinActive] = useState(false);
  const [instagramActive, setInstagramActive] = useState(false);
  const [selectedPages, setSelectedPages] = useState({ facebook: null, instagram: null, linkedin: null });
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

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      media.forEach(url => URL.revokeObjectURL(url));
    };
  }, [media]);

  // Handle media upload - multiple files
  const handleMediaUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const imageFiles = files.filter(file => file.type.startsWith("image/"));
      if (imageFiles.length > 0) {
        const newPreviews = imageFiles.map(file => URL.createObjectURL(file));
        setMediaFiles(prev => [...prev, ...imageFiles]);
        setMedia(prev => [...prev, ...newPreviews]);
      }
    }
    // Reset input to allow selecting the same file again
    e.target.value = '';
  };

  // Handle drag and drop - multiple files
  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(
      file => file.type.startsWith("image/")
    );
    
    if (files.length > 0) {
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setMediaFiles(prev => [...prev, ...files]);
      setMedia(prev => [...prev, ...newPreviews]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Navigation functions
  const nextImage = (e) => {
    e?.stopPropagation();
    if (media.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % media.length);
    }
  };

  const prevImage = (e) => {
    e?.stopPropagation();
    if (media.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + media.length) % media.length);
    }
  };

  const goToImage = (index) => {
    setCurrentImageIndex(index);
  };

  // Touch/swipe handlers
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && media.length > 1) {
      nextImage();
    }
    if (isRightSwipe && media.length > 1) {
      prevImage();
    }
  };

  // Remove an image
  const removeImage = (index) => {
    // Revoke object URL to prevent memory leaks
    URL.revokeObjectURL(media[index]);
    
    setMedia(prev => prev.filter((_, i) => i !== index));
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    
    // Adjust current index if needed
    if (index === currentImageIndex && media.length > 1) {
      setCurrentImageIndex(Math.max(0, index - 1));
    } else if (index < currentImageIndex) {
      setCurrentImageIndex(prev => prev - 1);
    }
    
    // If no images left, reset index
    if (media.length === 1) {
      setCurrentImageIndex(0);
    }
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
      
      // Combine date and time, create Date object in user's local timezone, then send as ISO string
      const scheduledDateTime = new Date(`${date}T${time}`);
      formData.append("scheduledDate", scheduledDateTime.toISOString());
      // Keep scheduledTime for backward compatibility, but backend will use ISO string if available
      formData.append("scheduledTime", time);
      
      // Add selectedPages if any pages are selected
      if (selectedPages.facebook || selectedPages.instagram || selectedPages.linkedin) {
        formData.append("selectedPages", JSON.stringify(selectedPages));
      }
      
      // Append all media files
      mediaFiles.forEach((file) => {
        formData.append("media", file);
      });

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
      const response = await fetch(`${apiUrl}/posts/create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess("Post scheduled successfully!");
        // Cleanup object URLs before clearing
        media.forEach(url => URL.revokeObjectURL(url));
        // Clear form
        setCaption("");
        setMedia([]);
        setMediaFiles([]);
        setFacebookActive(false);
        setLinkedinActive(false);
        setInstagramActive(false);
        setSelectedPages({ facebook: null, instagram: null, linkedin: null });
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
            
            {media.length === 0 ? (
              // Empty state - show upload area
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => document.getElementById("mediaUploadInput").click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center cursor-pointer hover:border-blue-500 transition-colors min-h-[120px] sm:min-h-[150px] flex flex-col items-center justify-center"
              >
                <FaImage className="mx-auto text-2xl sm:text-3xl text-gray-400 mb-2" />
                <p className="text-xs sm:text-sm text-gray-600 mb-1">
                  Click or drag & drop your images here
                </p>
                <p className="text-[10px] sm:text-xs text-gray-500">PNG, JPG, GIF up to 10MB each</p>
              </div>
            ) : (
              // Instagram-style carousel when images are uploaded
              <div className="space-y-3">
                {/* Main Carousel Display */}
                <div
                  className="relative bg-black rounded-lg overflow-hidden aspect-square max-h-[400px] sm:max-h-[500px]"
                  onTouchStart={onTouchStart}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEnd}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                >
                  {/* Current Image */}
                  <div className="relative w-full h-full flex items-center justify-center">
                    <img
                      src={media[currentImageIndex]}
                      alt={`Image ${currentImageIndex + 1}`}
                      className="w-full h-full object-contain"
                    />
                    
                    {/* Image Counter (Instagram style - top right) */}
                    {media.length > 1 && (
                      <div className="absolute top-3 right-3 bg-black/50 text-white px-2 py-1 rounded text-xs font-medium">
                        {currentImageIndex + 1} / {media.length}
                      </div>
                    )}
                    
                    {/* Remove Button (top left) */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(currentImageIndex);
                      }}
                      className="absolute top-3 left-3 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                      aria-label="Remove image"
                    >
                      <FaTimes className="text-sm" />
                    </button>
                    
                    {/* Navigation Arrows */}
                    {media.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={prevImage}
                          className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors"
                          aria-label="Previous image"
                        >
                          <FaChevronLeft />
                        </button>
                        <button
                          type="button"
                          onClick={nextImage}
                          className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors"
                          aria-label="Next image"
                        >
                          <FaChevronRight />
                        </button>
                      </>
                    )}
                  </div>
                  
                  {/* Dots Indicator (bottom center - Instagram style) */}
                  {media.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {media.map((_, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            goToImage(index);
                          }}
                          className={`h-1.5 rounded-full transition-all ${
                            index === currentImageIndex
                              ? 'bg-white w-6'
                              : 'bg-white/50 hover:bg-white/75 w-1.5'
                          }`}
                          aria-label={`Go to image ${index + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Thumbnail Strip (below carousel) */}
                {media.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    <style>{`
                      .thumbnail-scroll::-webkit-scrollbar {
                        display: none;
                      }
                    `}</style>
                    <div className="flex gap-2 thumbnail-scroll">
                      {media.map((preview, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => goToImage(index)}
                          className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 transition-all ${
                            index === currentImageIndex
                              ? 'border-blue-500 ring-2 ring-blue-200'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <img
                            src={preview}
                            alt={`Thumbnail ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Add More Images Button */}
                <button
                  type="button"
                  onClick={() => document.getElementById("mediaUploadInput").click()}
                  className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors"
                >
                  + Add More Images
                </button>
              </div>
            )}
            
            <input
              id="mediaUploadInput"
              type="file"
              accept="image/*"
              multiple
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

          {/* Page Selection for LinkedIn */}
          {linkedinActive && (
            <PageSelector
              platform="linkedin"
              value={selectedPages.linkedin}
              onChange={(pageId) => setSelectedPages({ ...selectedPages, linkedin: pageId })}
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
                {media.length > 0 && (
                  <div className="w-full relative bg-black aspect-square">
                    {media.length === 1 ? (
                      <img
                        src={media[0]}
                        alt="Post media"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <>
                        <img
                          src={media[currentImageIndex]}
                          alt={`Post media ${currentImageIndex + 1}`}
                          className="w-full h-full object-contain"
                        />
                        {/* Image counter */}
                        <div className="absolute top-3 right-3 bg-black/50 text-white px-2 py-1 rounded text-xs font-medium">
                          {currentImageIndex + 1} / {media.length}
                        </div>
                        {/* Dots indicator */}
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                          {media.map((_, index) => (
                            <div
                              key={index}
                              className={`h-1.5 rounded-full transition-all ${
                                index === currentImageIndex ? 'bg-white w-6' : 'bg-white/50 w-1.5'
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
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
