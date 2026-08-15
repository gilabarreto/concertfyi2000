export default function Pagination({ currentPage, totalPages, onPageChange }) {
  const MAX_VISIBLE = 5;

  const getVisiblePages = () => {
    if (totalPages <= MAX_VISIBLE) {
      return Array.from({ length: totalPages }, (_, i) => i);
    }

    // Se tem mais de 5 páginas, mostra 5 páginas ao redor da atual
    const half = Math.floor(MAX_VISIBLE / 2);
    let start = currentPage - half;
    let end = currentPage + half;

    // Ajusta se chegou no início
    if (start < 0) {
      start = 0;
      end = MAX_VISIBLE - 1;
    }

    // Ajusta se chegou no fim
    if (end >= totalPages) {
      end = totalPages - 1;
      start = end - MAX_VISIBLE + 1;
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const visiblePages = getVisiblePages();

  return (
    <div className="flex items-center justify-center space-x-2 mt-4 text-sm">
      <button
        className="px-2 py-1 rounded disabled:opacity-50"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 0}
      >
        &lt; Prev
      </button>

      {visiblePages.map((pageNum) => (
        <button
          key={pageNum}
          className={`px-2 py-1 rounded ${
            pageNum === currentPage
              ? "bg-red-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
          onClick={() => onPageChange(pageNum)}
        >
          {pageNum + 1}
        </button>
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
