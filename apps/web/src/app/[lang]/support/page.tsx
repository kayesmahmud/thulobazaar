/**
 * User Support Page
 * /[lang]/support - View and create support tickets
 */

import { Metadata } from 'next';
import SupportClient from './SupportClient';

export const metadata: Metadata = {
  title: 'Support | ThuluBazaar',
  description: 'Get help with your account, ads, payments, and more',
};

export default function SupportPage() {
  return <SupportClient />;
}
