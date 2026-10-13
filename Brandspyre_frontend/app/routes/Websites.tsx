import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { notify } from "~/services/notificationService";
import { apiClient } from "src/services/apiClient";
import { Globe, Plus, Edit, Trash2, Eye, Settings, Layout, FileText, Image, Code, ExternalLink, Copy, Check } from 'lucide-react';

interface Website {
  id: number;
  site_name: string;
  site_domain?: string;
  subdomain?: string;
  site_description?: string;
  site_type: string;
  status: string;
  is_published: boolean;
  published_url?: string;
  template_name?: string;
  created_at: string;
}

interface Template {
  id: number;
  template_name: string;
  template_category: string;
  template_description: string;
}

export default function Websites() {
  const navigate = useNavigate();
  const [websites, setWebsites] = useState<Website[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const [newWebsite, setNewWebsite] = useState({
    site_name: '',
    site_domain: '',
    subdomain: '',
    site_description: '',
    site_type: 'business'
  });

  useEffect(() => {
    fetchWebsites();
    fetchTemplates();
  }, []);

  const fetchWebsites = async () => {
    try {
      const response = await apiClient.get(`/websites/websites`);
      const result = response.data;
      if (result.success || result.data) {
        setWebsites(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching websites:', error);
      notify.error('Failed to load websites');
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await apiClient.get(`/websites/website-templates`);
      const result = response.data;
      if (result.success || result.data) {
        setTemplates(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const handleCreateWebsite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiClient.post(`/websites/websites`, {
        ...newWebsite,
        template_id: selectedTemplate?.id,
        site_config: {}
      });

      if (response.status === 200 || response.status === 201) {
        notify.success('Website created successfully');
        setShowCreateModal(false);
        setNewWebsite({
          site_name: '',
          site_domain: '',
          subdomain: '',
          site_description: '',
          site_type: 'business'
        });
        setSelectedTemplate(null);
        fetchWebsites();
      } else {
        notify.error(response.data?.error || 'Failed to create website');
      }
    } catch (error: any) {
      console.error('Error creating website:', error);
      notify.error(error.response?.data?.error || 'Failed to create website');
    }
  };

  const handlePublish = async (website: Website) => {
    try {
      const response = await apiClient.put(`/websites/websites/${website.id}`, {
        is_published: !website.is_published,
        status: website.is_published ? 'draft' : 'published',
        published_url: website.site_domain || `https://${website.subdomain}.brandspyre.com`
      });

      if (response.status === 200) {
        notify.success(website.is_published ? 'Website unpublished' : 'Website published successfully');
        fetchWebsites();
      } else {
        notify.error('Failed to update website status');
      }
    } catch (error: any) {
      console.error('Error publishing website:', error);
      notify.error(error.response?.data?.error || 'Failed to publish website');
    }
  };

  const handleDelete = async (websiteId: number) => {
    if (!confirm('Are you sure you want to delete this website? This action cannot be undone.')) return;

    try {
      const response = await apiClient.delete(`/websites/websites/${websiteId}`);

      if (response.status === 200) {
        notify.success('Website deleted successfully');
        fetchWebsites();
      } else {
        notify.error('Failed to delete website');
      }
    } catch (error: any) {
      console.error('Error deleting website:', error);
      notify.error(error.response?.data?.error || 'Failed to delete website');
    }
  };


  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Website Builder</h1>
          <p className="text-gray-600 mt-1">Create and publish dynamic websites</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center gap-2"
        >
          <Plus size={16} />
          New Website
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Globe className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{websites.length}</p>
              <p className="text-sm text-gray-500">Total Websites</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Eye className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {websites.filter(w => w.is_published).length}
              </p>
              <p className="text-sm text-gray-500">Published</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <FileText className="text-yellow-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {websites.filter(w => !w.is_published).length}
              </p>
              <p className="text-sm text-gray-500">Drafts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Websites List */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Your Websites</h2>
        </div>
        {websites.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Globe className="text-gray-400 mx-auto mb-4" size={64} />
            <p className="text-lg font-medium mb-2">No websites yet</p>
            <p className="mb-4">Create your first website using our templates</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Create Website
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {websites.map((website) => (
              <div key={website.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Globe className="text-indigo-600" size={24} />
                      <div>
                        <h3 className="font-semibold text-gray-900">{website.site_name}</h3>
                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                          {website.site_domain && (
                            <span className="text-indigo-600">{website.site_domain}</span>
                          )}
                          {website.subdomain && (
                            <span className="text-indigo-600">{website.subdomain}.brandspyre.com</span>
                          )}
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(website.status)}`}>
                            {website.status}
                          </span>
                          {website.template_name && (
                            <span className="text-gray-400">• {website.template_name}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {website.site_description && (
                      <p className="text-sm text-gray-600 mt-2 ml-9">{website.site_description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {website.is_published && website.published_url && (
                      <>
                        <button
                          onClick={() => window.open(website.published_url, '_blank')}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
                          title="View Website"
                        >
                          <ExternalLink size={18} />
                        </button>
                        <button
                          onClick={() => copyToClipboard(website.published_url!)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
                          title="Copy URL"
                        >
                          {copiedUrl === website.published_url ? <Check size={18} /> : <Copy size={18} />}
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handlePublish(website)}
                      className={`p-2 ${website.is_published ? 'text-yellow-600 hover:bg-yellow-50' : 'text-green-600 hover:bg-green-50'} rounded-md`}
                      title={website.is_published ? 'Unpublish' : 'Publish'}
                    >
                      <Eye size={18} />
                    </button>
                    <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-md" title="Edit">
                      <Edit size={18} />
                    </button>
                    <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-md" title="Settings">
                      <Settings size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(website.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Website Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Create New Website</h2>
            </div>
            <form onSubmit={handleCreateWebsite} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website Name *</label>
                <input
                  type="text"
                  value={newWebsite.site_name}
                  onChange={(e) => setNewWebsite({ ...newWebsite, site_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Custom Domain (optional)</label>
                  <input
                    type="text"
                    placeholder="yourdomain.com"
                    value={newWebsite.site_domain}
                    onChange={(e) => setNewWebsite({ ...newWebsite, site_domain: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subdomain (optional)</label>
                  <input
                    type="text"
                    placeholder="your-site"
                    value={newWebsite.subdomain}
                    onChange={(e) => setNewWebsite({ ...newWebsite, subdomain: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newWebsite.site_description}
                  onChange={(e) => setNewWebsite({ ...newWebsite, site_description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website Type</label>
                <select
                  value={newWebsite.site_type}
                  onChange={(e) => setNewWebsite({ ...newWebsite, site_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="business">Business</option>
                  <option value="ecommerce">E-commerce</option>
                  <option value="portfolio">Portfolio</option>
                  <option value="blog">Blog</option>
                  <option value="landing">Landing Page</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Choose Template (optional)</label>
                <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => setSelectedTemplate(null)}
                    className={`p-3 border rounded-lg text-left ${!selectedTemplate ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}`}
                  >
                    <div className="flex items-center gap-2">
                      <Layout size={16} />
                      <span className="text-sm font-medium">Blank Canvas</span>
                    </div>
                  </button>
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => setSelectedTemplate(template)}
                      className={`p-3 border rounded-lg text-left ${selectedTemplate?.id === template.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}`}
                    >
                      <div className="flex items-center gap-2">
                        <Layout size={16} />
                        <div>
                          <p className="text-sm font-medium">{template.template_name}</p>
                          <p className="text-xs text-gray-500">{template.template_category}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewWebsite({
                      site_name: '',
                      site_domain: '',
                      subdomain: '',
                      site_description: '',
                      site_type: 'business'
                    });
                    setSelectedTemplate(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Create Website
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
