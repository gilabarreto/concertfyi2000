export default function Pagination({ currentPage, totalPages, onPageChange }) {
  const getVisiblePages = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i);
    }

    // Perto do início: primeiras 3 + últimas 2
    if (currentPage <= 2) {
      return [0, 1, 2, totalPages - 2, totalPages - 1];
    }

    // Perto do final: primeiras 2 + últimas 3
    if (currentPage >= totalPages - 3) {
      return [0, 1, totalPages - 3, totalPages - 2, totalPages - 1];
    }

    // No meio: 5 contíguos (atual +/- 2)
    return [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2];
  };

  const visiblePages = getVisiblePages();

  // Detecta gap entre números (onde mostrar elipsis)
  const gapIndex = visiblePages.findIndex((page, idx) =>
    idx < visiblePages.length - 1 && visiblePages[idx + 1] - page > 1
  );

  return (
    <div className="flex items-center justify-center space-x-2 mt-4">
      <button
        className="px-2 py-1 rounded disabled:opacity-50"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 0}
      >
        &lt; Prev
      </button>

      {visiblePages.map((pageNum, idx) => (
        <>
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
          {gapIndex === idx && (
            <span key={`ellipsis-${idx}`} className="px-2 text-gray-500">...</span>
          )}
        </>
      ))}

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
