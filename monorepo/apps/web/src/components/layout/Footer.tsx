'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Instagram, Youtube, Mail, Phone, MapPin } from 'lucide-react';

// Custom TikTok icon (not available in lucide-react)
const TikTokIcon = ({ size = 18 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

interface FooterProps {
  lang: string;
}

export default function Footer({ lang }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Company Info */}
          <div className="space-y-4">
            <Link href={`/${lang}`} className="inline-block">
              <Image
                src="/logo-footer.png"
                alt="ThuluBazaar"
                width={140}
                height={100}
                className="h-20 w-auto object-contain"
                unoptimized
              />
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              Nepal&apos;s leading classifieds marketplace. Buy, sell, and rent across Nepal with ease.
            </p>

            {/* Social Media Icons */}
            <div className="flex space-x-3">
              <a
                href="https://facebook.com/thulobazaar"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-800 hover:bg-blue-600 p-2.5 rounded-full transition-all duration-300 hover:scale-110"
                aria-label="Facebook"
              >
                <Facebook size={18} />
              </a>
              <a
                href="https://instagram.com/thulobazaar"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-800 hover:bg-pink-600 p-2.5 rounded-full transition-all duration-300 hover:scale-110"
                aria-label="Instagram"
              >
                <Instagram size={18} />
              </a>
              <a
                href="https://tiktok.com/@thulobazaar"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-800 hover:bg-black p-2.5 rounded-full transition-all duration-300 hover:scale-110"
                aria-label="TikTok"
              >
                <TikTokIcon size={18} />
              </a>
              <a
                href="https://youtube.com/thulobazaar"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-800 hover:bg-red-600 p-2.5 rounded-full transition-all duration-300 hover:scale-110"
                aria-label="YouTube"
              >
                <Youtube size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">Quick Links</h4>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href={`/${lang}/all-ads`}
                  className="text-gray-400 hover:text-rose-400 transition-colors duration-200 flex items-center group"
                >
                  <span className="mr-2 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  Browse All Ads
                </Link>
              </li>
              <li>
                <Link
                  href={`/${lang}/post-ad`}
                  className="text-gray-400 hover:text-rose-400 transition-colors duration-200 flex items-center group"
                >
                  <span className="mr-2 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  Post Free Ad
                </Link>
              </li>
              <li>
                <Link
                  href={`/${lang}/shops`}
                  className="text-gray-400 hover:text-rose-400 transition-colors duration-200 flex items-center group"
                >
                  <span className="mr-2 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  Verified Shops
                </Link>
              </li>
              <li>
                <Link
                  href={`/${lang}/dashboard`}
                  className="text-gray-400 hover:text-rose-400 transition-colors duration-200 flex items-center group"
                >
                  <span className="mr-2 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  My Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href={`/${lang}/verification`}
                  className="text-gray-400 hover:text-rose-400 transition-colors duration-200 flex items-center group"
                >
                  <span className="mr-2 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  Get Verified
                </Link>
              </li>
            </ul>
          </div>

          {/* Popular Categories */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">Popular Categories</h4>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href={`/${lang}/ads/category/vehicles`}
                  className="text-gray-400 hover:text-rose-400 transition-colors duration-200 flex items-center group"
                >
                  <span className="mr-2 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  Vehicles
                </Link>
              </li>
              <li>
                <Link
                  href={`/${lang}/ads/category/electronics`}
                  className="text-gray-400 hover:text-rose-400 transition-colors duration-200 flex items-center group"
                >
                  <span className="mr-2 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  Electronics
                </Link>
              </li>
              <li>
                <Link
                  href={`/${lang}/ads/category/real-estate`}
                  className="text-gray-400 hover:text-rose-400 transition-colors duration-200 flex items-center group"
                >
                  <span className="mr-2 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  Real Estate
                </Link>
              </li>
              <li>
                <Link
                  href={`/${lang}/ads/category/jobs`}
                  className="text-gray-400 hover:text-rose-400 transition-colors duration-200 flex items-center group"
                >
                  <span className="mr-2 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  Jobs
                </Link>
              </li>
              <li>
                <Link
                  href={`/${lang}/ads/category/services`}
                  className="text-gray-400 hover:text-rose-400 transition-colors duration-200 flex items-center group"
                >
                  <span className="mr-2 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  Services
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3 text-gray-400">
                <MapPin size={20} className="text-rose-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">
                  Kathmandu, Nepal
                </span>
              </li>
              <li className="flex items-start space-x-3 text-gray-400">
                <Phone size={20} className="text-rose-500 mt-0.5 flex-shrink-0" />
                <a href="tel:+977-1-4567890" className="text-sm hover:text-rose-400 transition-colors">
                  +977-1-4567890
                </a>
              </li>
              <li className="flex items-start space-x-3 text-gray-400">
                <Mail size={20} className="text-rose-500 mt-0.5 flex-shrink-0" />
                <a href="mailto:support@thulobazaar.com" className="text-sm hover:text-rose-400 transition-colors">
                  support@thulobazaar.com
                </a>
              </li>
            </ul>

            {/* App Download Badges */}
            <div className="mt-6 space-y-2">
              <p className="text-sm text-gray-400 mb-3">Download Our App</p>
              <div className="flex flex-col space-y-2">
                <a
                  href="#"
                  className="hover:opacity-80 transition-opacity"
                >
                  <Image
                    src="/Appstore.png"
                    alt="Download on App Store"
                    width={140}
                    height={42}
                    className="h-11 w-auto"
                    unoptimized
                  />
                </a>
                <a
                  href="#"
                  className="hover:opacity-80 transition-opacity"
                >
                  <Image
                    src="/PlayStore.png"
                    alt="Get it on Google Play"
                    width={140}
                    height={42}
                    className="h-11 w-auto"
                    unoptimized
                  />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">

            {/* Copyright */}
            <div className="text-gray-400 text-sm text-center md:text-left">
              <p>&copy; {currentYear} ThuluBazaar. All rights reserved.</p>
              <p className="text-xs text-gray-500 mt-1">
                Built with Next.js 16 + TypeScript + Tailwind CSS
              </p>
            </div>

            {/* Legal Links */}
            <div className="flex flex-wrap justify-center md:justify-end gap-4 md:gap-6 text-sm">
              <Link
                href={`/${lang}/support/privacy-policy`}
                className="text-gray-400 hover:text-rose-400 transition-colors duration-200"
              >
                Privacy Policy
              </Link>
              <Link
                href={`/${lang}/support/terms-of-service`}
                className="text-gray-400 hover:text-rose-400 transition-colors duration-200"
              >
                Terms of Service
              </Link>
              <Link
                href={`/${lang}/support/contact`}
                className="text-gray-400 hover:text-rose-400 transition-colors duration-200"
              >
                Contact
              </Link>
              <Link
                href={`/${lang}/support/faq`}
                className="text-gray-400 hover:text-rose-400 transition-colors duration-200"
              >
                FAQ
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll to Top Button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-8 right-8 bg-gradient-to-br from-rose-500 to-pink-600 text-white p-3 rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 z-50"
        aria-label="Scroll to top"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 10l7-7m0 0l7 7m-7-7v18"
          />
        </svg>
      </button>
    </footer>
  );
}
