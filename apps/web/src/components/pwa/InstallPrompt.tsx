'use client';

import { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showBanner, setShowBanner] = useState(false);
    const [showIOSInstructions, setShowIOSInstructions] = useState(false);

    useEffect(() => {
        // Check if user has dismissed the banner before
        const dismissed = localStorage.getItem('pwa-install-dismissed');
        if (dismissed === 'true') {
            return;
        }

        // Detect iOS
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator as any).standalone;

        // Show iOS instructions if on iOS and not already installed
        if (isIOS && !isInStandaloneMode) {
            // Show after 5 seconds on iOS
            setTimeout(() => setShowIOSInstructions(true), 5000);
        }

        // Listen for beforeinstallprompt event (Android/Chrome)
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setShowBanner(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user's response
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        } else {
            console.log('User dismissed the install prompt');
        }

        // Clear the deferred prompt
        setDeferredPrompt(null);
        setShowBanner(false);
    };

    const handleDismiss = () => {
        setShowBanner(false);
        localStorage.setItem('pwa-install-dismissed', 'true');
    };

    const handleIOSDismiss = () => {
        setShowIOSInstructions(false);
        localStorage.setItem('pwa-install-dismissed', 'true');
    };

    // Android/Chrome Install Banner
    if (showBanner && deferredPrompt) {
        return (
            <div className="fixed bottom-20 left-4 right-4 lg:bottom-4 lg:left-auto lg:right-4 lg:max-w-md z-50 animate-slide-up">
                <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                    {/* Header with gradient */}
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 text-white">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                                    <Smartphone className="w-7 h-7 text-indigo-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">Install ThuluBazaar</h3>
                                    <p className="text-sm opacity-90">Get the app experience</p>
                                </div>
                            </div>
                            <button
                                onClick={handleDismiss}
                                className="text-white/80 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Benefits */}
                    <div className="p-4 space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                            <span className="text-green-500">✓</span>
                            <span>Works offline</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                            <span className="text-green-500">✓</span>
                            <span>Faster loading</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                            <span className="text-green-500">✓</span>
                            <span>Home screen access</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 p-4 pt-0">
                        <button
                            onClick={handleDismiss}
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Maybe Later
                        </button>
                        <button
                            onClick={handleInstallClick}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            Install Now
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // iOS Installation Instructions
    if (showIOSInstructions) {
        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end lg:items-center justify-center p-4 animate-fade-in">
                <div className="bg-white rounded-t-3xl lg:rounded-3xl max-w-md w-full shadow-2xl animate-slide-up">
                    {/* Header */}
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="font-bold text-xl text-gray-900">Install ThuluBazaar</h3>
                                <p className="text-sm text-gray-600 mt-1">Add to your home screen</p>
                            </div>
                            <button
                                onClick={handleIOSDismiss}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="p-6 space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-indigo-600">
                                1
                            </div>
                            <div>
                                <p className="text-gray-900 font-medium">Tap the Share button</p>
                                <p className="text-sm text-gray-600 mt-1">
                                    Look for <span className="inline-flex items-center px-2 py-1 bg-blue-100 rounded text-blue-700 font-mono text-xs">⬆️ Share</span> at the bottom of Safari
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-indigo-600">
                                2
                            </div>
                            <div>
                                <p className="text-gray-900 font-medium">Scroll and tap "Add to Home Screen"</p>
                                <p className="text-sm text-gray-600 mt-1">
                                    Look for <span className="inline-flex items-center px-2 py-1 bg-gray-100 rounded text-gray-700 text-xs">➕ Add to Home Screen</span>
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-indigo-600">
                                3
                            </div>
                            <div>
                                <p className="text-gray-900 font-medium">Tap "Add"</p>
                                <p className="text-sm text-gray-600 mt-1">The app will appear on your home screen</p>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 pt-0">
                        <button
                            onClick={handleIOSDismiss}
                            className="w-full px-4 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
                        >
                            Got it!
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
