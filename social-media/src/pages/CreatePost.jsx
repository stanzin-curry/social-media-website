import React, { useState } from "react";
import { useApp } from "../context/AppContext";

// Preview components
import PostPreviewInstagram from "../components/PostPreviewInstagram";
import PostPreviewFacebook from "../components/PostPreviewFacebook";
import PostPreviewLinkedIn from "../components/PostPreviewLinkedIn";

import PlatformSelector from "../components/PlatformSelector";
import ScheduleModal from "../components/ScheduleModal";

export default function CreatePost() {
  const { selectedPlatforms, schedulePost } = useApp();

  const [caption, setCaption] = useState("");
  const [media, setMedia] = useState(null);
  const [mediaFile, setMediaFile] = useState(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);

  // Upload Handler
  const handleMediaUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const previewURL = URL.createObjectURL(file);
      setMedia(previewURL);
      setMediaFile(file);
    }
  };

  // Schedule Handler
  const handleSchedule = async () => {
    if (!date || !time) {
      alert("Please select date and time");
      return;
    }

    if (!selectedPlatforms.length) {
      alert("Please select at least one platform");
      return;
    }

    setIsScheduling(true);
    try {
      await schedulePost({
        caption,
        media: mediaFile,
        date,
        time,
        platforms: selectedPlatforms,
      });

      setCaption("");
      setMedia(null);
      setMediaFile(null);
      setDate("");
      setTime("");
    } catch (err) {
      // Error notification is handled by AppContext
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* LEFT SIDE — Create Post */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <h3 className="text-base font-semibold mb-4">Create New Post</h3>

        <div className="space-y-5">
          {/* Caption */}
          <div>
            <label className="block text-sm font-medium mb-2">Post Caption</label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              rows="5"
              placeholder="Write your caption..."
            />
            <p className="text-xs text-gray-500 mt-1">{caption.length} / 2200</p>
          </div>

          {/* Upload Media */}
          <div>
            <label className="block text-sm font-medium mb-2">Upload Media</label>

            {/* Upload Box */}
            <div
              onClick={() =>
                document.getElementById("mediaUploadInput").click()
              }
              className="border-2 border-dashed rounded-lg p-6 text-center hover:border-green-500 cursor-pointer"
            >
              <i className="fas fa-cloud-upload-alt text-3xl mb-2" />
              <p className="text-xs text-gray-600">
                Click or drag & drop your media here
              </p>

              {media && (
                <div className="mt-4">
                  <img
                    src={media}
                    alt="preview"
                    className="w-full rounded-lg object-cover"
                  />
                </div>
              )}
            </div>

            {/* Hidden Input */}
            <input
              id="mediaUploadInput"
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleMediaUpload}
            />
          </div>

          {/* Platform Selector */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Select Platforms
            </label>
            <PlatformSelector />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-2">
                Schedule Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Schedule Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          {/* Schedule Button */}
          <button
            onClick={handleSchedule}
            disabled={isScheduling}
            className="w-full px-4 py-2 bg-green-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className="fas fa-clock mr-2" />
            {isScheduling ? 'Scheduling...' : 'Schedule Post'}
          </button>
        </div>
      </div>

      {/* RIGHT SIDE — Preview */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <h3 className="text-base font-semibold mb-4">Preview</h3>

        <div className="space-y-6">
          {/* Show previews based on selected platforms */}
          {selectedPlatforms.includes("instagram") && (
            <PostPreviewInstagram caption={caption} media={media} />
          )}

          {selectedPlatforms.includes("facebook") && (
            <PostPreviewFacebook caption={caption} media={media} />
          )}

          {selectedPlatforms.includes("linkedin") && (
            <PostPreviewLinkedIn caption={caption} media={media} />
          )}

          {/* If no platform selected */}
          {!selectedPlatforms.length && (
            <div className="text-center text-xs text-gray-500 py-8">
              <i className="fas fa-arrow-left text-2xl mb-2" />
              <p>Select a platform to see preview</p>
            </div>
          )}
        </div>
      </div>

      {/* Schedule Modal */}
      <ScheduleModal open={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}
