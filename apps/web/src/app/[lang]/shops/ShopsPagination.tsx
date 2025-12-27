'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Pagination } from '@/components/ui';

interface ShopsPaginationProps {
  currentPage: number;
  totalPages: number;
  lang: string;
}

export default function ShopsPagination({
  currentPage,
  totalPages,
  lang,
}: ShopsPaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/${lang}/shops?${params.toString()}`);
  };

  return (
    <Pagination
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={handlePageChange}
    />
  );
}
