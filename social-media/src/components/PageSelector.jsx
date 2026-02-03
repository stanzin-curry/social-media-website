import React, { useState, useEffect } from 'react';
import { accountAPI } from '../api/account.api.js';
import { FaFacebook, FaInstagram } from 'react-icons/fa';

export default function PageSelector({ platform, value, onChange, className = '' }) {
  // Handle both array (new) and string (legacy) formats
  const selectedValues = Array.isArray(value) ? value : (value ? [value] : []);
  
  const handleCheckboxChange = (pageId, isChecked) => {
    if (isChecked) {
      // Add to selection
      const newValue = [...selectedValues, pageId];
      onChange && onChange(newValue);
    } else {
      // Remove from selection
      const newValue = selectedValues.filter(id => id !== pageId);
      onChange && onChange(newValue.length > 0 ? newValue : []);
    }
  };
  const [pages, setPages] = useState([]);
  const [instagramAccounts, setInstagramAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (platform === 'facebook' || platform === 'instagram') {
      fetchPages();
    } else if (platform === 'linkedin') {
      fetchLinkedInPages();
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

  const fetchLinkedInPages = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await accountAPI.getLinkedInPages();
      if (response.success) {
        setPages(response.pages || []);
      } else {
        setError(response.message || 'Failed to fetch LinkedIn company pages');
      }
    } catch (err) {
      setError('Failed to load LinkedIn company pages. Please try again.');
      console.error('Error fetching LinkedIn pages:', err);
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
          Select Facebook Page(s)
        </label>
        <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto">
          {pages.length === 0 ? (
            <div className="text-xs sm:text-sm text-gray-500 py-2">
              No pages available
            </div>
          ) : (
            pages.map((page) => (
              <label
                key={page.id}
                className="flex items-center py-2 px-2 hover:bg-gray-50 rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedValues.includes(page.id)}
                  onChange={(e) => handleCheckboxChange(page.id, e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-3"
                />
                <span className="text-sm text-gray-700">{page.name}</span>
              </label>
            ))
          )}
        </div>
        {selectedValues.length > 0 && (
          <p className="text-xs text-gray-500 mt-2">
            {selectedValues.length} page(s) selected
          </p>
        )}
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
          Select Instagram Account(s)
        </label>
        <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto">
          {instagramAccounts.length === 0 ? (
            <div className="text-xs sm:text-sm text-gray-500 py-2">
              No accounts available
            </div>
          ) : (
            instagramAccounts.map((account) => (
              <label
                key={account.id}
                className="flex items-center py-2 px-2 hover:bg-gray-50 rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedValues.includes(account.id)}
                  onChange={(e) => handleCheckboxChange(account.id, e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-3"
                />
                <span className="text-sm text-gray-700">
                  @{account.username} ({account.pageName})
                </span>
              </label>
            ))
          )}
        </div>
        {selectedValues.length > 0 && (
          <p className="text-xs text-gray-500 mt-2">
            {selectedValues.length} account(s) selected
          </p>
        )}
      </div>
    );
  }

  if (platform === 'linkedin') {
    return (
      <div className={className}>
        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
          Select LinkedIn Page(s)
        </label>
        <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto">
          {/* Personal Profile Option */}
          <label className="flex items-center py-2 px-2 hover:bg-gray-50 rounded cursor-pointer">
            <input
              type="checkbox"
              checked={selectedValues.includes('personal')}
              onChange={(e) => handleCheckboxChange('personal', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-3"
            />
            <span className="text-sm text-gray-700">Personal Profile</span>
          </label>
          
          {/* Company Pages */}
          {pages.length === 0 ? (
            <div className="text-xs sm:text-sm text-gray-500 py-2 pl-6">
              No company pages available
            </div>
          ) : (
            pages.map((page) => (
              <label
                key={page.id}
                className="flex items-center py-2 px-2 hover:bg-gray-50 rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedValues.includes(page.id)}
                  onChange={(e) => handleCheckboxChange(page.id, e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-3"
                />
                <span className="text-sm text-gray-700">{page.name}</span>
              </label>
            ))
          )}
        </div>
        {selectedValues.length > 0 && (
          <p className="text-xs text-gray-500 mt-2">
            {selectedValues.length} page(s) selected
          </p>
        )}
      </div>
    );
  }

  return null;
}





