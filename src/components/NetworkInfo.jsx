"use client"
import { useState, useEffect } from 'react';
import { FaWifi, FaEthernet, FaCopy, FaCheck } from 'react-icons/fa';

export default function NetworkInfo({ onIPSelect }) {
  const [networkInfo, setNetworkInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchNetworkInfo = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/network-info');
      const data = await response.json();
      if (data.success) {
        setNetworkInfo(data.data);
      }
    } catch (error) {
      console.error('Error fetching network info:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const handleIPSelect = (ip) => {
    if (onIPSelect) {
      onIPSelect(ip);
    }
  };

  useEffect(() => {
    fetchNetworkInfo();
  }, []);

  if (!networkInfo) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <FaWifi className="text-blue-600 mr-2" />
            <span className="text-sm text-blue-800">Click to detect your current IP address</span>
          </div>
          <button
            onClick={fetchNetworkInfo}
            disabled={loading}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Detecting...' : 'Detect IP'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <FaEthernet className="text-green-600 mr-2" />
          <span className="text-sm font-medium text-green-800">Your Current IP Address</span>
        </div>
        <button
          onClick={() => copyToClipboard(networkInfo.clientIP)}
          className="flex items-center px-2 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
        >
          {copied ? <FaCheck className="mr-1" /> : <FaCopy className="mr-1" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <code className="text-sm bg-white px-2 py-1 rounded border">
            {networkInfo.clientIP}
          </code>
          <button
            onClick={() => handleIPSelect(networkInfo.clientIP)}
            className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
          >
            Use This IP
          </button>
        </div>
        
        {networkInfo.forwardedFor && (
          <div className="text-xs text-gray-600">
            <strong>Forwarded:</strong> {networkInfo.forwardedFor}
          </div>
        )}
        
        <div className="text-xs text-gray-500">
          Detected at: {new Date(networkInfo.timestamp).toLocaleString()}
        </div>
      </div>
    </div>
  );
}
