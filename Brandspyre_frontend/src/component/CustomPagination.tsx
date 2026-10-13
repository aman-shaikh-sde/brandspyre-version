import PropTypes from 'prop-types';

const CustomPagination = ({
  total = 0,
  currentPage = 1,
  defaultPageSize = 10,
  onChange,
  paginationLabel = 'items',
  isScroll = false,
}) => {
  const totalPages = Math.ceil(total / defaultPageSize);
  const startItem = (currentPage - 1) * defaultPageSize + 1;
  const endItem = Math.min(currentPage * defaultPageSize, total);

  const handlePageChange = (page) => {
    if (page !== currentPage && page >= 1 && page <= totalPages) {
      onChange(page);
      if (isScroll) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const getVisiblePages = () => {
    const visiblePages = [];
    const maxVisible = 3; 
    
    visiblePages.push(1);
    
    let start = Math.max(2, currentPage - 1);
    let end = Math.min(totalPages - 1, currentPage + 1);
    
    if (currentPage <= maxVisible) {
      end = maxVisible + 1;
    } else if (currentPage >= totalPages - maxVisible + 1) {
      start = totalPages - maxVisible;
    }
    
    if (start > 2) {
      visiblePages.push('...');
    }
    
    for (let i = start; i <= end; i++) {
      if (i > 1 && i < totalPages) {
        visiblePages.push(i);
      }
    }
    
    if (end < totalPages - 1) {
      visiblePages.push('...');
    }
    
    if (totalPages > 1) {
      visiblePages.push(totalPages);
    }
    
    return visiblePages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4">
      <div className="flex items-center gap-2">
        <span className="px-3 py-1 bg-red-100 dark:bg-gray-700 text-red-800 dark:text-gray-200 rounded-full font-medium">
          {startItem}
        </span>
        <span className="text-gray-500 dark:text-gray-400">-</span>
        <span className="px-3 py-1 bg-red-100 dark:bg-gray-700 text-red-800 dark:text-gray-200 rounded-full font-medium">
          {endItem}
        </span>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          of {total} {paginationLabel}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`p-2 rounded-md ${
            currentPage === 1
              ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              : 'bg-[var(--color-primary)] dark:bg-red-800 text-white hover:bg-red-800 transition-colors'
          }`}
          aria-label="Previous page"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {getVisiblePages().map((page, index) =>
          page === '...' ? (
            <span
              key={`ellipsis-${index}`}
              className="px-3 py-1 text-gray-500 dark:text-gray-400"
            >
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-1 rounded-md ${
                page === currentPage
                  ? 'bg-[var(--color-primary)] dark:bg-red-800  text-white'
                  : 'bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {page}
            </button>
          )
        )}

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`p-2 rounded-md ${
            currentPage === totalPages
              ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              : 'bg-[var(--color-primary)] dark:bg-red-800 text-white hover:bg-red-800 transition-colors'
          }`}
          aria-label="Next page"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

CustomPagination.propTypes = {
  total: PropTypes.number,
  currentPage: PropTypes.number,
  defaultPageSize: PropTypes.number,
  onChange: PropTypes.func.isRequired,
  paginationLabel: PropTypes.string,
  isScroll: PropTypes.bool,
};

export default CustomPagination;