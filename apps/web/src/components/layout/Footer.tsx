'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Mail, Phone, MapPin } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebookF, faInstagram, faTiktok, faYoutube } from '@fortawesome/free-brands-svg-icons';
import { useTranslations } from 'next-intl';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';

interface FooterProps {
  lang: string;
}

export default function Footer({ lang }: FooterProps) {
  const t = useTranslations('footer');
  const tc = useTranslations('common');
  const { supportPhone, contactEmail } = useSiteSettings();
  const currentYear = new Date().getFullYear();
  const pathname = usePathname();

  // Only show scroll-to-top button on homepage and ads listing page
  const showScrollToTop =
    pathname === `/${lang}` ||
    pathname === `/${lang}/ads` ||
    pathname?.startsWith(`/${lang}/ads?`);

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-12">

        {/* Mobile: Two-column grid layout like Bikroy */}
        <div className="md:hidden">
          {/* Row 1: Quick Links & Help */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 mb-6">
            {/* Quick Links */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">{t('quickLinks')}</h4>
              <ul className="space-y-2">
                <li><Link href={`/${lang}/shops`} className="text-sm text-gray-400 hover:text-rose-400">{t('verifiedShops')}</Link></li>
                <li><Link href={`/${lang}/verification`} className="text-sm text-gray-400 hover:text-rose-400">{t('getVerified')}</Link></li>
                <li><Link href={`/${lang}/blog`} className="text-sm text-gray-400 hover:text-rose-400">{t('blog')}</Link></li>
              </ul>
            </div>
            {/* Help & Support */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">{t('helpAndSupport')}</h4>
              <ul className="space-y-2">
                <li><Link href={`/${lang}/help`} className="text-sm text-gray-400 hover:text-rose-400">{t('helpCenter')}</Link></li>
                <li><Link href={`/${lang}/scam-prevention`} className="text-sm text-gray-400 hover:text-rose-400">{t('scamPrevention')}</Link></li>
                <li><Link href={`/${lang}/faq`} className="text-sm text-gray-400 hover:text-rose-400">{t('faq')}</Link></li>
                <li><Link href={`/${lang}/live-chat`} className="text-sm text-gray-400 hover:text-rose-400">{t('liveChat')}</Link></li>
              <li><Link href={`/${lang}/support`} className="text-sm text-gray-400 hover:text-rose-400">{t('supportTickets')}</Link></li>
                <li><Link href={`/${lang}/contact`} className="text-sm text-gray-400 hover:text-rose-400">{t('contactUs')}</Link></li>
              </ul>
            </div>
          </div>

          {/* Row 2: About & Contact */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 mb-6">
            {/* About */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">{t('about')}</h4>
              <ul className="space-y-2">
                <li><Link href={`/${lang}/support/privacy-policy`} className="text-sm text-gray-400 hover:text-rose-400">{t('privacyPolicy')}</Link></li>
                <li><Link href={`/${lang}/support/terms-of-service`} className="text-sm text-gray-400 hover:text-rose-400">{t('termsAndConditions')}</Link></li>
                <li><Link href={`/${lang}/work-with-us`} className="text-sm text-gray-400 hover:text-rose-400">{t('workWithUs')}</Link></li>
              </ul>
            </div>
            {/* Contact */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">{t('contact')}</h4>
              <ul className="space-y-2">
                <li className="text-sm text-gray-400">{t('kathmandu')}</li>
                <li><a href={`tel:${supportPhone}`} className="text-sm text-gray-400 hover:text-rose-400">{supportPhone}</a></li>
              </ul>
            </div>
          </div>

          {/* Row 3: Download App */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-white mb-3">{t('downloadOurApp')}</h4>
            <div className="flex gap-2">
              <a href="https://play.google.com/store/apps/details?id=com.thulobazaar.mobile" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
                <Image src="/PlayStore.png" alt="Get it on Google Play" width={120} height={36} className="h-9 w-auto" />
              </a>
              <a href="https://apps.apple.com/us/app/thulo-bazaar/id6774762315" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
                <Image src="/Appstore.png" alt="Download on App Store" width={120} height={36} className="h-9 w-auto" />
              </a>
            </div>
          </div>

          {/* Social Icons - Centered */}
          <div className="flex justify-center space-x-4 mb-6">
            <a href="https://facebook.com/thulobazaar" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400" aria-label="Facebook">
              <FontAwesomeIcon icon={faFacebookF} className="w-5 h-5" />
            </a>
            <a href="https://instagram.com/thulobazaar" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-400" aria-label="Instagram">
              <FontAwesomeIcon icon={faInstagram} className="w-5 h-5" />
            </a>
            <a href="https://tiktok.com/@thulobazaar" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white" aria-label="TikTok">
              <FontAwesomeIcon icon={faTiktok} className="w-5 h-5" />
            </a>
            <a href="https://youtube.com/thulobazaar" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-red-400" aria-label="YouTube">
              <FontAwesomeIcon icon={faYoutube} className="w-5 h-5" />
            </a>
          </div>

          {/* Copyright - Centered */}
          <div className="text-center border-t border-gray-700 pt-4">
            <p className="text-xs text-gray-400">&copy; {currentYear} {tc('appName')}. {tc('allRightsReserved')}</p>
          </div>
        </div>

        {/* Desktop: Original 4-column layout */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">

          {/* Company Info */}
          <div className="space-y-4">
            <Link href={`/${lang}`} className="inline-block">
              <Image
                src="/logo-footer.png"
                alt="Thulo Bazaar"
                width={140}
                height={100}
                className="h-20 w-auto object-contain"
              />
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              {t('companyDescription')}
            </p>

            {/* Social Media Icons */}
            <div className="flex space-x-3">
              <a
                href="https://facebook.com/thulobazaar"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-600 hover:bg-blue-700 p-2 rounded-full transition-all duration-300 hover:scale-110"
                aria-label="Facebook"
              >
                <FontAwesomeIcon icon={faFacebookF} className="w-4 h-4" />
              </a>
              <a
                href="https://instagram.com/thulobazaar"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 hover:from-purple-700 hover:via-pink-700 hover:to-orange-600 p-2 rounded-full transition-all duration-300 hover:scale-110"
                aria-label="Instagram"
              >
                <FontAwesomeIcon icon={faInstagram} className="w-4 h-4" />
              </a>
              <a
                href="https://tiktok.com/@thulobazaar"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-black hover:bg-gray-800 p-2 rounded-full transition-all duration-300 hover:scale-110"
                aria-label="TikTok"
              >
                <FontAwesomeIcon icon={faTiktok} className="w-4 h-4" />
              </a>
              <a
                href="https://youtube.com/thulobazaar"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-red-600 hover:bg-red-700 p-2 rounded-full transition-all duration-300 hover:scale-110"
                aria-label="YouTube"
              >
                <FontAwesomeIcon icon={faYoutube} className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">{t('quickLinks')}</h4>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href={`/${lang}/shops`}
                  className="text-gray-400 hover:text-rose-400 transition-colors duration-200 flex items-center group"
                >
                  <span className="mr-2 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  {t('verifiedShops')}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${lang}/verification`}
                  className="text-gray-400 hover:text-rose-400 transition-colors duration-200 flex items-center group"
                >
                  <span className="mr-2 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  {t('getVerified')}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${lang}/blog`}
                  className="text-gray-400 hover:text-rose-400 transition-colors duration-200 flex items-center group"
                >
                  <span className="mr-2 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  {t('blog')}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${lang}/work-with-us`}
                  className="text-gray-400 hover:text-rose-400 transition-colors duration-200 flex items-center group"
                >
                  <span className="mr-2 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  {t('workWithUs')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Help & Support */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">{t('helpAndSupport')}</h4>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href={`/${lang}/help`}
                  className="text-gray-400 hover:text-rose-400 transition-colors duration-200 flex items-center group"
                >
                  <span className="mr-2 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  {t('helpCenter')}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${lang}/scam-prevention`}
                  className="text-gray-400 hover:text-rose-400 transition-colors duration-200 flex items-center group"
                >
                  <span className="mr-2 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  {t('scamPrevention')}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${lang}/faq`}
                  className="text-gray-400 hover:text-rose-400 transition-colors duration-200 flex items-center group"
                >
                  <span className="mr-2 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  {t('faq')}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${lang}/live-chat`}
                  className="text-gray-400 hover:text-rose-400 transition-colors duration-200 flex items-center group"
                >
                  <span className="mr-2 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  {t('liveChat')}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${lang}/support`}
                  className="text-gray-400 hover:text-rose-400 transition-colors duration-200 flex items-center group"
                >
                  <span className="mr-2 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  {t('supportTickets')}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${lang}/contact`}
                  className="text-gray-400 hover:text-rose-400 transition-colors duration-200 flex items-center group"
                >
                  <span className="mr-2 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  {t('contactUs')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">{t('contactUs')}</h4>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3 text-gray-400">
                <MapPin size={20} className="text-rose-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">
                  {t('kathmandu')}
                </span>
              </li>
              <li className="flex items-start space-x-3 text-gray-400">
                <Phone size={20} className="text-rose-500 mt-0.5 flex-shrink-0" />
                <a href={`tel:${supportPhone}`} className="text-sm hover:text-rose-400 transition-colors">
                  {supportPhone}
                </a>
              </li>
              <li className="flex items-start space-x-3 text-gray-400">
                <Mail size={20} className="text-rose-500 mt-0.5 flex-shrink-0" />
                <a href={`mailto:${contactEmail}`} className="text-sm hover:text-rose-400 transition-colors">
                  {contactEmail}
                </a>
              </li>
            </ul>

            {/* App Download Badges */}
            <div className="mt-6 space-y-2">
              <p className="text-sm text-gray-400 mb-3">{t('downloadOurApp')}</p>
              <div className="flex flex-col space-y-2">
                <a
                  href="https://apps.apple.com/us/app/thulo-bazaar/id6774762315"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity"
                >
                  <Image
                    src="/Appstore.png"
                    alt="Download on App Store"
                    width={140}
                    height={42}
                    className="h-11 w-auto"
                  />
                </a>
                <a
                  href="https://play.google.com/store/apps/details?id=com.thulobazaar.mobile"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity"
                >
                  <Image
                    src="/PlayStore.png"
                    alt="Get it on Google Play"
                    width={140}
                    height={42}
                    className="h-11 w-auto"
                  />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar - Desktop only */}
      <div className="hidden md:block border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">

            {/* Copyright */}
            <div className="text-gray-400 text-sm text-center md:text-left">
              <p>&copy; {currentYear} {tc('appName')}. {tc('allRightsReserved')}</p>
            </div>

            {/* Legal Links */}
            <div className="flex flex-wrap justify-center md:justify-end gap-4 md:gap-6 text-sm">
              <Link
                href={`/${lang}/support/privacy-policy`}
                className="text-gray-400 hover:text-rose-400 transition-colors duration-200"
              >
                {t('privacyPolicy')}
              </Link>
              <Link
                href={`/${lang}/support/terms-of-service`}
                className="text-gray-400 hover:text-rose-400 transition-colors duration-200"
              >
                {t('termsOfService')}
              </Link>
              <Link
                href={`/${lang}/contact`}
                className="text-gray-400 hover:text-rose-400 transition-colors duration-200"
              >
                {t('contact')}
              </Link>
              <Link
                href={`/${lang}/faq`}
                className="text-gray-400 hover:text-rose-400 transition-colors duration-200"
              >
                {t('faq')}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll to Top Button - Only on homepage and ads page */}
      {showScrollToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-24 right-4 lg:bottom-8 lg:right-8 bg-gradient-to-br from-rose-500 to-pink-600 text-white p-3 rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 z-50"
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
      )}
    </footer>
  );
}
