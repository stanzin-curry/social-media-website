import React from "react";

export default function StatsCard({ title, value, icon, color }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-4 border-l-4 flex items-center gap-4"
         style={{ borderColor: color }}>
      
      {/* Icon */}
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl`}
           style={{ background: color }}>
        <i className={icon}></i>
      </div>

      {/* Info */}
      <div>
        <p className="text-gray-600 text-sm font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
}
