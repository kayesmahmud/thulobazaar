'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Pagination from '@/components/Pagination';

interface AllAdsPaginationProps {
  currentPage: number;
  totalPages: number;
  lang: string;
}

export default function AllAdsPagination({
  currentPage,
  totalPages,
  lang,
}: AllAdsPaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (newPage: number) => {
    // Create new URLSearchParams preserving all existing filters
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());

    // Navigate to new URL with updated page
    router.push(`/${lang}/all-ads?${params.toString()}`);
  };

  return (
    <Pagination
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={handlePageChange}
    />
  );
}
