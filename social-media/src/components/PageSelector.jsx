import React, { useState, useEffect } from 'react';
import { accountAPI } from '../api/account.api.js';
import { FaFacebook, FaInstagram } from 'react-icons/fa';

export default function PageSelector({ platform, value, onChange, className = '' }) {
  const [pages, setPages] = useState([]);
  const [instagramAccounts, setInstagramAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (platform === 'facebook' || platform === 'instagram') {
      fetchPages();
    }
  }, [platform]);

  const fetchPages = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await accountAPI.getFacebookPages();
      if (response.success) {
        setPages(response.pages || []);
        setInstagramAccounts(response.instagramAccounts || []);
      } else {
        setError(response.message || 'Failed to fetch pages');
      }
    } catch (err) {
      setError('Failed to load pages. Please try again.');
      console.error('Error fetching pages:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`text-sm text-gray-500 py-2 ${className}`}>
        Loading pages...
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-sm text-red-500 py-2 ${className}`}>
        {error}
      </div>
    );
  }

  if (platform === 'facebook') {
    if (pages.length === 0) {
      return (
        <div className={`text-xs sm:text-sm text-gray-500 py-2 ${className}`}>
          No Facebook pages found. Please reconnect your Facebook account.
        </div>
      );
    }

    return (
      <div className={className}>
        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
          Select Facebook Page
        </label>
        <select
          value={value || ''}
          onChange={(e) => onChange && onChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm sm:text-base min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select a page...</option>
          {pages.map((page) => (
            <option key={page.id} value={page.id}>
              {page.name}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (platform === 'instagram') {
    if (instagramAccounts.length === 0) {
      return (
        <div className={`text-xs sm:text-sm text-gray-500 py-2 ${className}`}>
          No Instagram accounts found. Please connect a Facebook page with an Instagram Business Account.
        </div>
      );
    }

    return (
      <div className={className}>
        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
          Select Instagram Account
        </label>
        <select
          value={value || ''}
          onChange={(e) => onChange && onChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm sm:text-base min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select an account...</option>
          {instagramAccounts.map((account) => (
            <option key={account.id} value={account.id}>
              @{account.username} ({account.pageName})
            </option>
          ))}
        </select>
      </div>
    );
  }

  return null;
}



