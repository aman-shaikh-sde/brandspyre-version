import { useEffect, useState } from "react";
import DataTable from "./DataTable";
import CustomPagination from "./CustomPagination";
import SearchInput from "./SearchInput";
import Modal from "./Modal";
import Dropdown from "./DrapDown";
import { FileDown, Upload, Eye, Edit2, Trash2, FileText } from "lucide-react";
import { apiClient } from "src/services/apiClient";
import { BASE_URL } from "~/constants/api";
import toast, { Toaster } from "react-hot-toast";
import { useAuthStore } from "src/stores/authStore";

interface Document {
  id: number;
  document_title: string;
  document_type: string;
  category: string;
  description: string;
  file_name: string;
  file_path: string;
  file_size: number;
  upload_date: string;
  created_by: string;
}

const DocumentManager = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [deleteId, setDeleteId] = useState("");
  
  const token = useAuthStore((state) => state.accessToken);

  const categories = [
    { value: "", label: "All Categories" },
    { value: "contract", label: "Contracts" },
    { value: "invoice", label: "Invoices" },
    { value: "report", label: "Reports" },
    { value: "legal", label: "Legal" },
    { value: "other", label: "Other" },
  ];

  const documentTypes = [
    { value: "", label: "All Types" },
    { value: "pdf", label: "PDF" },
    { value: "doc", label: "Word Document" },
    { value: "docx", label: "Word Document" },
    { value: "jpg", label: "Image" },
    { value: "jpeg", label: "Image" },
    { value: "png", label: "Image" },
  ];

  const pageSizeOptions = [
    { value: 10, label: "10 per page" },
    { value: 20, label: "20 per page" },
    { value: 50, label: "50 per page" },
    { value: 100, label: "100 per page" },
  ];

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      let url = `/documents/view?page=${currentPage}&limit=${pageSize}`;
      
      if (searchTerm) url += `&search=${searchTerm}`;
      if (selectedCategory) url += `&category=${selectedCategory}`;
      if (selectedType) url += `&document_type=${selectedType}`;

      const response = await apiClient.get(url);

      setDocuments(response.data.data || []);
      setTotal(response.data.pagination?.total || 0);
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast.error("Failed to fetch documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [currentPage, pageSize, searchTerm, selectedCategory, selectedType]);

  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    toast.success("Document uploaded successfully!");
    fetchDocuments();
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    toast.success("Document updated successfully!");
    fetchDocuments();
  };

  const handleDeleteSubmit = async () => {
    try {
      setLoading(true);
      await apiClient.delete(`/documents/delete`, {
        data: { document_id: deleteId },
      });

      setShowDeleteModal(false);
      toast.success("Document deleted successfully!");
      fetchDocuments();
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Failed to delete document");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (documentId: number, fileName: string) => {
    try {
      const response = await apiClient.get(`/documents/download/${documentId}`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading document:", error);
      toast.error("Failed to download document");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const thead = () => [
    { data: "Title" },
    { data: "Type" },
    { data: "Category" },
    { data: "File Name" },
    { data: "Size" },
    { data: "Upload Date" },
    { data: "Actions", className: "text-center" },
  ];

  const tbody = () => {
    return documents.map((doc) => ({
      id: doc.id,
      data: [
        { data: doc.document_title },
        { 
          data: (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
              {doc.document_type.toUpperCase()}
            </span>
          )
        },
        { data: doc.category || '-' },
        { data: doc.file_name },
        { data: formatFileSize(doc.file_size) },
        { data: new Date(doc.upload_date).toLocaleDateString() },
        {
          data: (
            <div className="flex justify-center gap-2">
              <button
                className="p-1 text-blue-700 rounded hover:text-blue-900"
                title="Download"
                onClick={() => handleDownload(doc.id, doc.file_name)}
              >
                <FileDown size={16} />
              </button>
              <button
                className="p-1 text-green-700 rounded hover:text-green-900"
                title="View"
                onClick={() => window.open(`/uploads/documents/${doc.file_name}`, '_blank')}
              >
                <Eye size={16} />
              </button>
              <button
                className="p-1 text-yellow-700 rounded hover:text-yellow-900"
                title="Edit"
                onClick={() => {
                  setSelectedDocument(doc);
                  setShowEditModal(true);
                }}
              >
                <Edit2 size={16} />
              </button>
              <button
                className="p-1 text-red-600 rounded hover:text-red-800"
                title="Delete"
                onClick={() => {
                  setDeleteId(doc.id.toString());
                  setShowDeleteModal(true);
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ),
        },
      ],
    }));
  };

  return (
    <>
      <div className="flex flex-col min-h-screen">
        <div className="p-4 flex-grow">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-[var(--color-primary)]">
              Document Management
            </h2>
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 text-white bg-[var(--color-primary)] hover:bg-[var(--color-hover)] px-4 py-2 rounded"
            >
              <Upload size={16} />
              Upload Document
            </button>
          </div>

          <Toaster position="top-center" reverseOrder={false} />

          <div className="flex flex-wrap gap-4 mb-6">
            <Dropdown
              options={categories}
              selectedValue={selectedCategory}
              onSelect={(value) => setSelectedCategory(String(value))}
              placeholder="Category"
              className="w-[200px]"
            />
            <Dropdown
              options={documentTypes}
              selectedValue={selectedType}
              onSelect={(value) => setSelectedType(String(value))}
              placeholder="Document Type"
              className="w-[200px]"
            />
            <Dropdown
              options={pageSizeOptions}
              selectedValue={pageSize}
              onSelect={(value) => setPageSize(Number(value))}
              placeholder="Per Page"
              className="w-[150px]"
            />
            <div className="flex-1 min-w-[200px]">
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search documents..."
                className="w-full"
              />
            </div>
          </div>

          {loading && <div className="text-center py-4">Loading...</div>}

          <div className="overflow-x-auto">
            <DataTable
              thead={thead}
              tbody={tbody}
              className="min-w-full"
            />
          </div>
        </div>

        <div className="border-t border-gray-200 p-4">
          <CustomPagination
            total={total}
            currentPage={currentPage}
            defaultPageSize={pageSize}
            onChange={setCurrentPage}
            paginationLabel="documents"
            isScroll={true}
          />
        </div>
      </div>

      {/* Upload Modal */}
      <Modal
        isVisible={showUploadModal}
        className="w-full md:w-[600px]"
        onClose={() => setShowUploadModal(false)}
        title="Upload Document"
      >
        <DocumentUploadForm onCancel={() => setShowUploadModal(false)} onSuccess={handleUploadSuccess} />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isVisible={showEditModal}
        className="w-full md:w-[600px]"
        onClose={() => setShowEditModal(false)}
        title="Edit Document"
      >
        <DocumentEditForm 
          document={selectedDocument} 
          onCancel={() => setShowEditModal(false)} 
          onSuccess={handleEditSuccess} 
        />
      </Modal>

      {/* Delete Modal */}
      <Modal
        isVisible={showDeleteModal}
        className="w-full md:w-[400px]"
        onClose={() => setShowDeleteModal(false)}
        title="Delete Document"
      >
        <div className="flex flex-col gap-6 justify-center items-center">
          <p className="text-gray-500 text-lg font-bold text-center">
            Are you sure you want to delete this document?
          </p>
          <div className="flex gap-4">
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              onClick={handleDeleteSubmit}
              disabled={loading}
            >
              {loading ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

// Placeholder components - these would need to be implemented
const DocumentUploadForm = ({ onCancel, onSuccess }: any) => (
  <div className="p-4">
    <p className="text-gray-500">Document upload form to be implemented</p>
    <div className="flex gap-2 mt-4">
      <button onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
      <button onClick={onSuccess} className="px-4 py-2 bg-blue-600 text-white rounded">Upload</button>
    </div>
  </div>
);

const DocumentEditForm = ({ document, onCancel, onSuccess }: any) => (
  <div className="p-4">
    <p className="text-gray-500">Document edit form to be implemented</p>
    <div className="flex gap-2 mt-4">
      <button onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
      <button onClick={onSuccess} className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
    </div>
  </div>
);

export default DocumentManager;
