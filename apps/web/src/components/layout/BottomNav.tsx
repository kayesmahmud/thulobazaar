'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, PlusCircle, MessageCircle, User } from 'lucide-react';

interface BottomNavProps {
    lang: string;
    unreadCount?: number;
}

export default function BottomNav({ lang, unreadCount = 0 }: BottomNavProps) {
    const pathname = usePathname();
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    // Hide on scroll down, show on scroll up
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            if (currentScrollY < lastScrollY || currentScrollY < 50) {
                // Scrolling up or near top
                setIsVisible(true);
            } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
                // Scrolling down
                setIsVisible(false);
            }

            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    const navItems = [
        {
            name: 'Home',
            href: `/${lang}`,
            icon: Home,
            active: pathname === `/${lang}`,
        },
        {
            name: 'Search',
            href: `/${lang}/all-ads`,
            icon: Search,
            active: pathname?.includes('/all-ads') || pathname?.includes('/search'),
        },
        {
            name: 'Post',
            href: `/${lang}/post-ad`,
            icon: PlusCircle,
            active: pathname?.includes('/post-ad'),
            isPrimary: true, // Center FAB
        },
        {
            name: 'Messages',
            href: `/${lang}/messages`,
            icon: MessageCircle,
            active: pathname?.includes('/messages'),
            badge: unreadCount,
        },
        {
            name: 'Profile',
            href: `/${lang}/dashboard`,
            icon: User,
            active: pathname?.includes('/dashboard') || pathname?.includes('/profile'),
        },
    ];

    return (
        <nav
            className={`fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 lg:hidden transition-transform duration-300 ${isVisible ? 'translate-y-0' : 'translate-y-full'
                }`}
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
            <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
                {navItems.map((item) => {
                    const Icon = item.icon;

                    if (item.isPrimary) {
                        // Primary FAB (Post Ad)
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className="relative -mt-8"
                            >
                                <div className="w-14 h-14 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110">
                                    <Icon className="w-7 h-7 text-white" strokeWidth={2.5} />
                                </div>
                            </Link>
                        );
                    }

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex flex-col items-center justify-center flex-1 py-2 transition-colors relative ${item.active
                                    ? 'text-rose-500'
                                    : 'text-gray-600 hover:text-rose-500'
                                }`}
                        >
                            <div className="relative">
                                <Icon className="w-6 h-6" strokeWidth={item.active ? 2.5 : 2} />

                                {/* Unread badge for messages */}
                                {item.badge && item.badge > 0 && (
                                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                                        {item.badge > 99 ? '99+' : item.badge}
                                    </span>
                                )}
                            </div>

                            <span
                                className={`text-[10px] mt-0.5 font-medium ${item.active ? 'font-semibold' : ''
                                    }`}
                            >
                                {item.name}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
