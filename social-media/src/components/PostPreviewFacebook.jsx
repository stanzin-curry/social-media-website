import React from "react";

export default function PostPreviewFacebook({ caption, media }) {
  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
      {/* Facebook header */}
      <div className="flex items-center gap-3 p-4">
        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
          F
        </div>
        <div>
          <p className="font-semibold text-gray-800 text-sm">Your Page</p>
          <p className="text-xs text-gray-500">Just now · <i className="fas fa-globe"></i></p>
        </div>
      </div>

      {/* Caption */}
      {caption && (
        <div className="px-4 pb-3 text-sm text-gray-800">
          {caption}
        </div>
      )}

      {/* Media */}
      {media && (Array.isArray(media) ? media.length > 0 : media) && (
        <div className="w-full">
          {Array.isArray(media) ? (
            media.length === 1 ? (
              <img src={media[0]} alt="facebook media" className="w-full object-cover" />
            ) : (
              <div className="grid grid-cols-2 gap-1">
                {media.map((mediaUrl, index) => (
                  <img key={index} src={mediaUrl} alt={`facebook media ${index + 1}`} className="w-full object-cover" />
                ))}
              </div>
            )
          ) : (
            <img src={media} alt="facebook media" className="w-full object-cover" />
          )}
        </div>
      )}

      {/* Engagement section */}
      <div className="px-4 py-3 text-xs text-gray-500 border-t">
        👍 0 · ❤️ 0 · 😮 0
      </div>
    </div>
  );
}
