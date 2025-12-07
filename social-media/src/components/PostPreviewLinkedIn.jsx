import React from "react";

export default function PostPreviewLinkedIn({ caption, media }) {
  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-xl shadow-md border border-gray-300 overflow-hidden">
      {/* LI Header */}
      <div className="flex items-center gap-3 p-4">
        <div className="w-10 h-10 bg-blue-700 text-white flex items-center justify-center rounded">
          in
        </div>
        <div>
          <p className="font-semibold text-gray-800 text-sm">Your Company</p>
          <p className="text-xs text-gray-500">Just now • <i className="fas fa-globe"></i></p>
        </div>
      </div>

      {/* Caption */}
      {caption && (
        <div className="px-4 pb-3 text-sm text-gray-800 leading-relaxed">
          {caption}
        </div>
      )}

      {/* Media */}
      {media && (
        <div>
          <img src={media} alt="linkedin" className="w-full object-cover" />
        </div>
      )}

      {/* Engagement */}
      <div className="px-4 py-3 text-xs text-gray-500 border-t">
        👍 0 · 💬 0 · 🔗 0
      </div>
    </div>
  );
}
