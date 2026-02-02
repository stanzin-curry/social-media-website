import React from "react";

export default function PostPreviewInstagram({ caption, media }) {
  return (
    <div className="w-full max-w-sm mx-auto bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
      {/* IG Header */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-yellow-400 to-pink-600 flex items-center justify-center text-white font-bold">
            IG
          </div>
          <p className="font-semibold text-sm text-gray-800">yourbrand</p>
        </div>
        <i className="fas fa-ellipsis-h text-gray-600"></i>
      </div>

      {/* Media */}
      {media && (Array.isArray(media) ? media.length > 0 : media) && (
        Array.isArray(media) ? (
          media.length === 1 ? (
            <img src={media[0]} alt="instagram preview" className="w-full object-cover" />
          ) : (
            <div className="grid grid-cols-2 gap-1">
              {media.map((mediaUrl, index) => (
                <img key={index} src={mediaUrl} alt={`instagram preview ${index + 1}`} className="w-full object-cover" />
              ))}
            </div>
          )
        ) : (
          <img src={media} alt="instagram preview" className="w-full object-cover" />
        )
      )}

      {/* Action buttons */}
      <div className="flex items-center justify-between px-3 py-2 text-xl">
        <div className="flex items-center gap-4">
          <i className="far fa-heart"></i>
          <i className="far fa-comment"></i>
          <i className="far fa-paper-plane"></i>
        </div>
        <i className="far fa-bookmark"></i>
      </div>

      {/* Caption */}
      <div className="px-3 pb-3 text-sm">
        <span className="font-semibold">yourbrand</span> {caption}
      </div>
    </div>
  );
}
