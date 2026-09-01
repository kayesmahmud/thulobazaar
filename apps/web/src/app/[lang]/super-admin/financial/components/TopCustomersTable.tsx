'use client';

import Link from 'next/link';
import { formatCurrency, type TopCustomer } from '../types';

interface TopCustomersTableProps {
  data: TopCustomer[];
  lang: string;
}

export default function TopCustomersTable({ data, lang }: TopCustomersTableProps) {
  if (data.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Top Customers</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Customer</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Transactions</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Total Spent</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((customer) => (
              <tr key={customer.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <Link
                    href={`/${lang}/super-admin/financial/customers/${customer.id}`}
                    className="block group"
                  >
                    <div className="font-semibold text-indigo-600 group-hover:text-indigo-800 group-hover:underline">
                      {customer.fullName}
                    </div>
                    <div className="text-sm text-gray-500">{customer.email}</div>
                  </Link>
                </td>
                <td className="px-6 py-4 text-gray-600">{customer.transactions}</td>
                <td className="px-6 py-4 text-right font-bold text-gray-900">{formatCurrency(customer.totalSpent)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
