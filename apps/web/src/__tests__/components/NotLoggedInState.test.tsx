import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

const translations: Record<string, string> = {
  signedOutTitle: 'Talk to the seller',
  signedOutBody: 'Ask, offer, agree — right here.',
  signInToChat: 'Sign in to chat',
  newHere: 'New here? Create a free account',
};

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => translations[key] || key,
}));

vi.mock('next/navigation', () => ({
  useParams: () => ({ lang: 'ne' }),
}));

vi.mock('next-auth/react', () => ({
  signOut: vi.fn(),
}));

import { NotLoggedInState } from '@/components/messages/MessagesPage/LoadingStates';

describe('NotLoggedInState', () => {
  it('names the step and the goal, and both links come back to messages', () => {
    render(<NotLoggedInState />);

    expect(screen.getByText('Talk to the seller')).toBeInTheDocument();

    const signIn = screen.getByRole('link', { name: 'Sign in to chat' });
    expect(signIn).toHaveAttribute('href', '/ne/auth/signin?callbackUrl=%2Fne%2Fmessages');

    const signUp = screen.getByRole('link', { name: 'New here? Create a free account' });
    expect(signUp).toHaveAttribute('href', '/ne/auth/signup?callbackUrl=%2Fne%2Fmessages');
  });
});
