'use client';

/**
 * Live Chat — one endless conversation, deliberately simpler than a support
 * ticket: no subject, no category, no status badges, nothing to "close".
 * The AI assistant answers first and hands over to the team when it cannot
 * help; from the user's side that handover is invisible except in the replies.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useTranslations, useLocale } from 'next-intl';
import { format } from 'date-fns';
import { Send, Headphones, ImagePlus, X } from 'lucide-react';
import { useBackendToken } from '@/hooks/useBackendToken';
import { useSupportSocket } from '@/hooks/useSupportSocket';
import { checkProfanity } from '@/utils/profanityCheck';
import {
  isImageAttachment,
  SUPPORT_IMAGE_LIMIT_CODE,
  SUPPORT_IMAGE_MAX_BYTES,
} from '@/lib/supportAttachmentDisplay';

interface LiveChatMessage {
  id: number;
  senderId: number;
  content: string;
  type?: string;
  attachmentUrl?: string | null;
  createdAt: string;
  isOwnMessage: boolean;
  sender: { id: number; fullName: string | null; avatar: string | null; isStaff: boolean };
}

const WARNING_DISMISS_MS = 5000;

export default function LiveChatClient() {
  const t = useTranslations('liveChat');
  const locale = useLocale();
  const { data: session, status: sessionStatus } = useSession();
  const { backendToken, loading: tokenLoading } = useBackendToken();

  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [ticketId, setTicketId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [pendingImagePreview, setPendingImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Preview is an object URL — revoke it whenever the photo changes or goes away.
  useEffect(() => {
    if (!pendingImage) {
      setPendingImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(pendingImage);
    setPendingImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingImage]);

  const showWarning = (text: string) => {
    setWarning(text);
    setTimeout(() => setWarning(null), WARNING_DISMISS_MS);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset so the same file can be picked again after removing it.
    e.target.value = '';
    if (!file) return;
    if (file.size > SUPPORT_IMAGE_MAX_BYTES) {
      showWarning(t('imageTooLarge'));
      return;
    }
    setPendingImage(file);
  };
  // Shown between the user's message and the assistant's reply — the AI takes
  // several seconds to think, and without this the screen looks frozen.
  const [assistantTyping, setAssistantTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const stopTypingIndicator = useCallback(() => {
    setAssistantTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, []);

  // Safety net: if no reply ever arrives (AI disabled, timeout, escalation
  // handled by a human later), the dots must not hang around forever.
  const startTypingIndicator = useCallback(() => {
    setAssistantTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => setAssistantTyping(false), 30000);
  }, []);

  useEffect(() => () => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  }, []);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
  }, []);

  // Read the live thread id without making it a socket-handler dependency
  // (useSupportSocket rebuilds the connection when a handler changes identity).
  const ticketIdRef = useRef<number | null>(null);
  useEffect(() => {
    ticketIdRef.current = ticketId;
  }, [ticketId]);

  // Socket delivers staff/AI replies live.
  const handleNewMessage = useCallback(
    (data: { ticketId: number; message: any }) => {
      const current = ticketIdRef.current;
      if (current !== null && data.ticketId !== current) return;

      const incoming = data.message;
      // Keyed on who sent it, not on id arithmetic: the socket also echoes the
      // user's own message back, and a staff/assistant reply is the only thing
      // that should stop the typing dots.
      if (incoming?.sender?.isStaff) stopTypingIndicator();

      const currentUserId = Number((session?.user as any)?.id);
      const isOwn = incoming.senderId === currentUserId;
      setMessages((prev) =>
        prev.some((m) => m.id === incoming.id)
          ? prev
          : [...prev, { ...incoming, isOwnMessage: isOwn }]
      );
      scrollToBottom();
    },
    [session?.user, scrollToBottom, stopTypingIndicator]
  );

  const { isConnected, joinTicket, leaveTicket } = useSupportSocket({
    token: backendToken,
    isStaff: false,
    onNewMessage: handleNewMessage,
  });

  const loadChat = useCallback(async () => {
    if (!backendToken) return;
    try {
      const response = await fetch('/api/support/live-chat', {
        headers: { Authorization: `Bearer ${backendToken}` },
      });
      const data = await response.json();
      if (data.success) {
        setTicketId(data.data.ticketId);
        setMessages(data.data.messages || []);
        scrollToBottom();
      }
    } catch (err) {
      console.error('Live chat load error:', err);
    } finally {
      setLoading(false);
    }
  }, [backendToken, scrollToBottom]);

  useEffect(() => {
    if (!backendToken) return;
    loadChat();
  }, [backendToken, loadChat]);

  // Join the thread room so replies arrive without a refresh.
  useEffect(() => {
    if (!ticketId || !isConnected) return;
    joinTicket(ticketId);
    return () => leaveTicket(ticketId);
  }, [ticketId, isConnected, joinTicket, leaveTicket]);

  /** Returns the stored URL, or null after showing the right warning. */
  const uploadPendingImage = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await fetch('/api/support/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${backendToken}` },
      body: formData,
    });
    const data = await response.json().catch(() => null);
    if (data?.success && data.data?.url) return data.data.url;
    const limitHit = response.status === 429 || data?.code === SUPPORT_IMAGE_LIMIT_CODE;
    showWarning(limitHit ? t('imageLimitReached') : t('imageUploadFailed'));
    return null;
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = input.trim();
    if ((!content && !pendingImage) || sending) return;

    if (content && checkProfanity(content).hasProfanity) {
      showWarning(t('profanityWarning'));
      return;
    }
    setWarning(null);
    setSending(true);
    try {
      let attachmentUrl: string | null = null;
      if (pendingImage) {
        attachmentUrl = await uploadPendingImage(pendingImage);
        if (!attachmentUrl) return;
      }

      const response = await fetch('/api/support/live-chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${backendToken}`,
        },
        body: JSON.stringify(attachmentUrl ? { content, attachmentUrl } : { content }),
      });
      const data = await response.json().catch(() => null);
      if (data?.success) {
        setInput('');
        setPendingImage(null);
        setTicketId(data.data.ticketId);
        setMessages((prev) =>
          prev.some((m) => m.id === data.data.message.id)
            ? prev
            : [...prev, { ...data.data.message, isOwnMessage: true }]
        );
        startTypingIndicator();
        scrollToBottom();
        return;
      }
      if (response.status === 429 || data?.code === SUPPORT_IMAGE_LIMIT_CODE) {
        showWarning(t('imageLimitReached'));
      } else if (attachmentUrl) {
        showWarning(t('imageUploadFailed'));
      }
    } catch (err) {
      console.error('Live chat send error:', err);
      if (pendingImage) showWarning(t('imageUploadFailed'));
    } finally {
      setSending(false);
    }
  };

  const canSend = (!!input.trim() || !!pendingImage) && !sending;

  if (sessionStatus === 'loading' || tokenLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-rose-200 border-t-rose-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (sessionStatus === 'unauthenticated') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-50 flex items-center justify-center">
            <Headphones className="w-7 h-7 text-rose-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">{t('signInRequired')}</h1>
          <p className="text-gray-600 mb-5">{t('signInMessage')}</p>
          <Link
            href={`/${locale}/auth/signin`}
            className="inline-block px-6 py-2.5 bg-rose-600 text-white rounded-lg font-medium hover:bg-rose-700 transition-colors"
          >
            {t('signIn')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex flex-col h-[calc(100vh-180px)] min-h-[480px] bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white">
          <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center">
            <Headphones className="w-5 h-5 text-rose-600" />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-gray-900 leading-tight">{t('title')}</h1>
            <p className="text-xs text-gray-500">{t('subtitle')}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50/60">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="w-7 h-7 border-2 border-rose-200 border-t-rose-600 rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-6">
              <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center mb-3">
                <Headphones className="w-6 h-6 text-rose-600" />
              </div>
              <p className="font-semibold text-gray-800">{t('emptyTitle')}</p>
              <p className="text-sm text-gray-500 mt-1 max-w-xs">{t('emptyBody')}</p>
            </div>
          ) : (
            messages.map((message, index) => {
              const previous = messages[index - 1];
              const isSequence = previous?.senderId === message.senderId;
              return (
                <div
                  key={message.id}
                  className={`flex ${message.isOwnMessage ? 'justify-end' : 'justify-start'} ${
                    isSequence ? 'mt-1' : 'mt-4'
                  }`}
                >
                  <div
                    className={`max-w-[80%] sm:max-w-[70%] px-4 py-2.5 text-sm shadow-sm ${
                      message.isOwnMessage
                        ? 'bg-rose-600 text-white rounded-l-2xl rounded-tr-2xl rounded-br-md'
                        : 'bg-white text-gray-800 border border-gray-100 rounded-r-2xl rounded-tl-2xl rounded-bl-md'
                    }`}
                  >
                    {!message.isOwnMessage && !isSequence && (
                      <p className="text-xs font-bold mb-1 text-rose-600">
                        {message.sender.fullName}
                      </p>
                    )}
                    {message.attachmentUrl && isImageAttachment(message) && (
                      <a
                        href={message.attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block overflow-hidden rounded-lg hover:opacity-90 transition-opacity"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={message.attachmentUrl}
                          alt={t('photo')}
                          className="max-w-full h-auto max-h-64 rounded-lg object-cover"
                        />
                      </a>
                    )}
                    {message.content && (
                      <p className={`whitespace-pre-wrap break-words ${message.attachmentUrl ? 'mt-2' : ''}`}>
                        {message.content}
                      </p>
                    )}
                    <div
                      className={`text-[11px] mt-1 ${
                        message.isOwnMessage ? 'text-white/70 text-right' : 'text-gray-400'
                      }`}
                    >
                      {format(new Date(message.createdAt), 'h:mm a')}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          {assistantTyping && (
            <div className="flex justify-start mt-4" aria-live="polite">
              <div className="bg-white border border-gray-100 rounded-r-2xl rounded-tl-2xl rounded-bl-md px-4 py-3 shadow-sm">
                <span className="sr-only">{t('assistantTyping')}</span>
                <div className="flex items-center gap-1">
                  {[0, 150, 300].map((delay) => (
                    <span
                      key={delay}
                      className="w-2 h-2 bg-rose-400 rounded-full animate-bounce"
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {warning && (
          <div className="px-4 py-2 bg-amber-50 border-t border-amber-200 text-amber-800 text-sm">
            {warning}
          </div>
        )}

        <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-200">
          {pendingImagePreview && (
            <div className="flex items-center gap-3 mb-2 px-1">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={pendingImagePreview}
                  alt={t('photo')}
                  className="h-16 w-16 rounded-lg object-cover border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => setPendingImage(null)}
                  disabled={sending}
                  aria-label={t('removePhoto')}
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-gray-800 text-white flex items-center justify-center hover:bg-gray-900 disabled:opacity-50"
                >
                  <X size={14} />
                </button>
              </div>
              <span className="text-xs text-gray-500" aria-live="polite">
                {sending ? t('sendingPhoto') : t('photo')}
              </span>
            </div>
          )}
          <div className="flex items-end gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={sending}
              aria-label={t('attachPhoto')}
              title={t('attachPhoto')}
              className="min-w-11 min-h-11 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 transition-colors"
            >
              <ImagePlus size={22} />
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e as unknown as React.FormEvent);
                }
              }}
              rows={1}
              placeholder={t('inputPlaceholder')}
              className="flex-1 min-w-0 resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent max-h-32"
            />
            <button
              type="submit"
              disabled={!canSend}
              aria-label={t('send')}
              className="min-w-11 min-h-11 flex items-center justify-center rounded-xl bg-rose-600 text-white disabled:opacity-50 hover:bg-rose-700 transition-colors"
            >
              {sending ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send size={20} />
              )}
            </button>
          </div>
          <p className="text-[11px] text-gray-400 mt-1.5 px-1">{t('aiNotice')}</p>
        </form>
      </div>
    </div>
  );
}
