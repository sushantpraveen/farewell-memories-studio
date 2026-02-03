import React from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface TablePaginationProps {
  /** Current 1-based page */
  currentPage: number;
  /** Items per page */
  pageSize: number;
  /** Total number of items across all pages */
  total: number;
  /** Callback when page or page size changes */
  onPageChange: (page: number, pageSize?: number) => void;
  /** Optional: allow changing page size (show size selector) */
  pageSizeOptions?: number[];
  /** Optional: label for the list (e.g. "ambassadors") */
  itemLabel?: string;
}

export function TablePagination({
  currentPage,
  pageSize,
  total,
  onPageChange,
  pageSizeOptions = [10, 20, 50],
  itemLabel = 'items',
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, total);

  const handlePrev = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  const handleSizeChange = (value: string) => {
    const newSize = Number(value);
    onPageChange(1, newSize);
  };

  // Build page numbers to show (current, neighbours, first, last)
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | 'ellipsis')[] = [];
    if (currentPage <= 3) {
      pages.push(1, 2, 3, 4, 'ellipsis', totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, 'ellipsis', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages);
    }
    return pages;
  };

  if (total === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-1">
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>
          Showing {start}–{end} of {total} {itemLabel}
        </span>
        {pageSizeOptions.length > 1 && (
          <div className="flex items-center gap-2">
            <span>Per page</span>
            <Select
              value={String(pageSize)}
              onValueChange={handleSizeChange}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      <Pagination>
        <PaginationContent className="gap-1">
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handlePrev();
              }}
              className={
                currentPage <= 1
                  ? 'pointer-events-none opacity-50'
                  : 'cursor-pointer'
              }
              aria-disabled={currentPage <= 1}
            />
          </PaginationItem>
          {getPageNumbers().map((p, i) =>
            p === 'ellipsis' ? (
              <PaginationItem key={`ellipsis-${i}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={p}>
                <PaginationLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onPageChange(p);
                  }}
                  isActive={currentPage === p}
                  className="cursor-pointer"
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            )
          )}
          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleNext();
              }}
              className={
                currentPage >= totalPages
                  ? 'pointer-events-none opacity-50'
                  : 'cursor-pointer'
              }
              aria-disabled={currentPage >= totalPages}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}