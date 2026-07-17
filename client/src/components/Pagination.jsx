export default function Pagination({ currentPage, totalPages, onPageChange }) {
  const getVisiblePages = () => {
    const pages = [];
    const maxVisible = 5;
    const halfVisible = Math.floor(maxVisible / 2);

    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i);
    }

    const start = Math.max(0, currentPage - halfVisible);
    const end = Math.min(totalPages - 1, currentPage + halfVisible);

    const rangeStart = Math.max(0, end - maxVisible + 1);
    const rangeEnd = Math.min(totalPages - 1, start + maxVisible - 1);

    for (let i = rangeStart; i <= rangeEnd; i++) {
      pages.push(i);
    }

    return pages;
  };

  const visiblePages = getVisiblePages();
  const showStartEllipsis = visiblePages[0] > 0;
  const showEndEllipsis = visiblePages[visiblePages.length - 1] < totalPages - 1;

  return (
    <div className="flex items-center justify-center space-x-2 mt-4">
      <button
        className="px-2 py-1 rounded disabled:opacity-50"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 0}
      >
        &lt; Prev
      </button>

      {showStartEllipsis && (
        <>
          <button
            className={`px-2 py-1 rounded ${
              0 === currentPage
                ? "bg-red-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
            onClick={() => onPageChange(0)}
          >
            1
          </button>
          <span className="px-2 text-gray-500">...</span>
        </>
      )}

      {visiblePages.map((pageNum) => (
        <button
          key={pageNum}
          className={`px-2 py-1 rounded ${
            pageNum === currentPage
              ? "bg-red-600 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
          onClick={() => onPageChange(pageNum)}
        >
          {pageNum + 1}
        </button>
      ))}

      {showEndEllipsis && (
        <>
          <span className="px-2 text-gray-500">...</span>
          <button
            className={`px-2 py-1 rounded ${
              totalPages - 1 === currentPage
                ? "bg-red-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
            onClick={() => onPageChange(totalPages - 1)}
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        className="px-2 py-1 rounded disabled:opacity-50"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages - 1}
      >
        Next &gt;
      </button>
    </div>
  );
}
