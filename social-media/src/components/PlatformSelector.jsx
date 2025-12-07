// import React from 'react'
// import { useApp } from '../context/AppContext'

// export default function PlatformSelector(){
//   const { connectedAccounts, togglePlatform, selectedPlatforms } = useApp()
//   const platforms = Object.keys(connectedAccounts).filter(k=>connectedAccounts[k])

//   if (platforms.length === 0) {
//     return <div className="text-center text-sm text-gray-500 py-4 w-full">Connect accounts first to select platforms</div>
//   }

//   return (
//     <div className="flex flex-col sm:flex-row gap-2">
//       {platforms.map(p => (
//         <button key={p} onClick={()=>togglePlatform(p)} id={`platform-${p}`} className={`flex-1 px-3 py-2 border-2 rounded font-medium ${selectedPlatforms.includes(p) ? 'border-green-500 bg-green-50 text-green-600' : 'border-gray-300 text-gray-600'}`}>
//           <i className={`fab fa-${p} mr-2`} />{p.charAt(0).toUpperCase()+p.slice(1)}
//         </button>
//       ))}
//     </div>
//   )
// }


// new code below 


import React from "react";
import { useApp } from "../context/AppContext";
import { FaFacebook, FaTwitter, FaInstagram } from "react-icons/fa";

const ICONS = {
  facebook: FaFacebook,
  twitter: FaTwitter,
  instagram: FaInstagram,
};

export default function PlatformSelector() {
  const { connectedAccounts, togglePlatform, selectedPlatforms } = useApp();

  const platforms = Object.keys(connectedAccounts).filter(
    (key) => connectedAccounts[key]
  );

  if (platforms.length === 0) {
    return (
      <div className="text-center text-sm text-gray-500 py-4 w-full">
        Connect accounts first to select platforms
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      {platforms.map((p) => {
        const Icon = ICONS[p]; // pick icon
        const isSelected = selectedPlatforms.includes(p);

        return (
          <button
            key={p}
            onClick={() => togglePlatform(p)}
            id={`platform-${p}`}
            className={`flex-1 px-3 py-2 border-2 rounded font-medium flex items-center justify-center gap-2
            ${
              isSelected
                ? "border-green-500 bg-green-50 text-green-600"
                : "border-gray-300 text-gray-600"
            }`}
          >
            {Icon && <Icon />}
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        );
      })}
    </div>
  );
}

