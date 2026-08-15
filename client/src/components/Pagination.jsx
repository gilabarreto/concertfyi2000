export default function Pagination({ currentPage, totalPages, onPageChange }) {
  const getVisiblePages = () => {
    // Se tiver 4 ou menos páginas, mostra todas
    if (totalPages <= 4) {
      return Array.from({ length: totalPages }, (_, i) => i);
    }

    // Se tiver mais de 4: mostra 1 2 3 ... última
    return [0, 1, 2, totalPages - 1];
  };

  const visiblePages = getVisiblePages();

  // Detecta gap entre números (onde mostrar elipsis)
  // Só mostra elipsis se houver gap entre dois números
  const gapIndex = visiblePages.findIndex((page, idx) =>
    idx < visiblePages.length - 1 && visiblePages[idx + 1] - page > 1
  );

  return (
    <div className="flex items-center justify-center space-x-2 mt-4 text-sm">
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
