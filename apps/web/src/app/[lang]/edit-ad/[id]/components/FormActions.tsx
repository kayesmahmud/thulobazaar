'use client';

import Link from 'next/link';
import { Button } from '@/components/ui';

interface FormActionsProps {
  lang: string;
  submitting: boolean;
}

export function FormActions({ lang, submitting }: FormActionsProps) {
  return (
    <div className="flex gap-4 justify-end pt-4 border-t border-gray-200">
      <Link
        href={`/${lang}/dashboard`}
        className="px-8 py-3 rounded-lg border border-gray-300 bg-white no-underline text-gray-700 font-medium"
      >
        Cancel
      </Link>
      <Button type="submit" variant="success" loading={submitting} disabled={submitting}>
        {submitting ? 'Saving...' : 'Save Changes'}
      </Button>
    </div>
  );
}
