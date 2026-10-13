import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { notify } from "~/services/notificationService";
import apiClient from "src/services/apiClient";
import { Image, Video, Plus, FolderOpen, Trash2, Edit, Download, Share2, Layout, Type, Palette, Layers } from 'lucide-react';

interface Template {
  id: number;
  template_name: string;
  template_type: string;
  description: string;
  category: string;
  template_data: any;
  thumbnail_url?: string;
}

interface Project {
  id: number;
  project_name: string;
  project_type: string;
  status: string;
  template_name?: string;
  output_url?: string;
  created_at: string;
}

export default function Marketing() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'templates' | 'projects' | 'editor'>('templates');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  useEffect(() => {
    if (activeTab === 'templates') fetchTemplates();
    if (activeTab === 'projects') fetchProjects();
  }, [activeTab]);

  const fetchTemplates = async () => {
    try {
      const response = await apiClient.get('/marketing/templates');
      const result = response.data;
      if (result.success || result.data) {
        setTemplates(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      notify.error('Failed to load templates');
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await apiClient.get('/marketing/projects');
      const result = response.data;
      if (result.success || result.data) {
        setProjects(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      notify.error('Failed to load projects');
    }
  };

  const handleCreateProject = async (template: Template) => {
    setNewProjectName(`${template.template_name} - ${new Date().toLocaleDateString()}`);
    setSelectedTemplate(template);
    setShowCreateModal(true);
  };

  const handleConfirmCreate = async () => {
    if (!selectedTemplate || !newProjectName) return;

    try {
      const response = await apiClient.post('/marketing/projects', {
        project_name: newProjectName,
        project_type: selectedTemplate.template_type,
        template_id: selectedTemplate.id,
        project_data: selectedTemplate.template_data
      });

      if (response.status >= 200 && response.status < 300) {
        notify.success('Project created successfully');
        setShowCreateModal(false);
        setNewProjectName('');
        setSelectedTemplate(null);
        setActiveTab('projects');
        fetchProjects();
      } else {
        notify.error('Failed to create project');
      }
    } catch (error: any) {
      console.error('Error creating project:', error);
      notify.error(error.response?.data?.error || 'Failed to create project');
    }
  };

  const handleDeleteProject = async (projectId: number) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      const response = await apiClient.delete(`/marketing/projects/${projectId}`);

      if (response.status >= 200 && response.status < 300) {
        notify.success('Project deleted successfully');
        fetchProjects();
      } else {
        notify.error('Failed to delete project');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      notify.error('Failed to delete project');
    }
  };


  const renderTemplateCard = (template: Template) => (
    <div key={template.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
      <div 
        className="aspect-square bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center cursor-pointer"
        onClick={() => handleCreateProject(template)}
      >
        {template.template_type === 'video' ? (
          <Video className="text-indigo-600" size={48} />
        ) : (
          <Image className="text-indigo-600" size={48} />
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900">{template.template_name}</h3>
        <p className="text-sm text-gray-500 mt-1">{template.description}</p>
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
            {template.category}
          </span>
          <button
            onClick={() => handleCreateProject(template)}
            className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
          >
            Use Template
          </button>
        </div>
      </div>
    </div>
  );

  const renderProjectCard = (project: Project) => (
    <div key={project.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {project.project_type === 'video' ? (
              <Video className="text-indigo-600" size={20} />
            ) : (
              <Image className="text-indigo-600" size={20} />
            )}
            <h3 className="font-semibold text-gray-900">{project.project_name}</h3>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {project.template_name || 'Custom Design'}
          </p>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            <span className={`px-2 py-1 rounded-full text-xs ${
              project.status === 'published' ? 'bg-green-100 text-green-800' :
              project.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {project.status}
            </span>
            <span>{new Date(project.created_at).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-md" title="Edit">
            <Edit size={18} />
          </button>
          {project.output_url && (
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-md" title="Download">
              <Download size={18} />
            </button>
          )}
          <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-md" title="Share">
            <Share2 size={18} />
          </button>
          <button
            onClick={() => handleDeleteProject(project.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-md"
            title="Delete"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marketing Studio</h1>
          <p className="text-gray-600 mt-1">Create posters, videos, and digital marketing content</p>
        </div>
        <button
          onClick={() => setActiveTab('templates')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center gap-2"
        >
          <Plus size={16} />
          New Project
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'templates'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Layout className="inline mr-2" size={18} />
          Templates
        </button>
        <button
          onClick={() => setActiveTab('projects')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'projects'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FolderOpen className="inline mr-2" size={18} />
          My Projects
        </button>
      </div>

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div>
          <div className="flex gap-2 mb-6">
            <button className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-md text-sm font-medium">
              All
            </button>
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200">
              Social Media
            </button>
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200">
              Print
            </button>
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200">
              Video
            </button>
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200">
              E-commerce
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {templates.map(renderTemplateCard)}
          </div>
        </div>
      )}

      {/* Projects Tab */}
      {activeTab === 'projects' && (
        <div>
          {projects.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="text-gray-400 mx-auto mb-4" size={64} />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects yet</h3>
              <p className="text-gray-500 mb-4">Create your first marketing project from templates</p>
              <button
                onClick={() => setActiveTab('templates')}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Browse Templates
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map(renderProjectCard)}
            </div>
          )}
        </div>
      )}

      {/* Editor Tab (placeholder) */}
      {activeTab === 'editor' && (
        <div className="bg-gray-100 rounded-lg p-8 text-center">
          <Palette className="text-gray-400 mx-auto mb-4" size={64} />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Marketing Editor</h3>
          <p className="text-gray-500">
            Drag-and-drop editor would be implemented here with canvas manipulation,
            layer management, text editing, image upload, and export functionality.
          </p>
          <div className="flex justify-center gap-4 mt-6">
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center gap-2">
              <Type size={16} />
              Add Text
            </button>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center gap-2">
              <Image size={16} />
              Add Image
            </button>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center gap-2">
              <Layers size={16} />
              Layers
            </button>
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">Create New Project</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              {selectedTemplate && (
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-600">
                    Template: <span className="font-medium">{selectedTemplate.template_name}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Type: <span className="font-medium">{selectedTemplate.template_type}</span>
                  </p>
                </div>
              )}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewProjectName('');
                    setSelectedTemplate(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmCreate}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Create Project
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
