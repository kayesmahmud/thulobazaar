import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OtpVerificationStep } from '@/app/[lang]/auth/reset-password/components/OtpVerificationStep';
import React from 'react';

describe('OtpVerificationStep', () => {
  const defaultProps = {
    otp: ['', '', '', '', '', ''],
    isLoading: false,
    isResending: false,
    cooldown: 0,
    inputRefs: { current: [] as (HTMLInputElement | null)[] },
    onOtpChange: vi.fn(),
    onOtpKeyDown: vi.fn(),
    onSubmit: vi.fn(),
    onResendOtp: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================
  // Rendering Tests
  // ==========================================
  describe('Rendering', () => {
    it('should render 6 OTP input fields', () => {
      render(<OtpVerificationStep {...defaultProps} />);

      const inputs = screen.getAllByRole('textbox');
      expect(inputs).toHaveLength(6);
    });

    it('should render submit button', () => {
      render(<OtpVerificationStep {...defaultProps} />);

      expect(screen.getByRole('button', { name: /verify code/i })).toBeInTheDocument();
    });

    it('should render resend OTP button when cooldown is 0', () => {
      render(<OtpVerificationStep {...defaultProps} />);

      expect(screen.getByRole('button', { name: /resend otp/i })).toBeInTheDocument();
    });

    it('should show cooldown timer when cooldown > 0', () => {
      render(<OtpVerificationStep {...defaultProps} cooldown={30} />);

      expect(screen.getByText(/resend in 30s/i)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /resend otp/i })).not.toBeInTheDocument();
    });
  });

  // ==========================================
  // Input Behavior Tests
  // ==========================================
  describe('Input Behavior', () => {
    it('should call onOtpChange when input value changes', () => {
      const onOtpChange = vi.fn();
      render(<OtpVerificationStep {...defaultProps} onOtpChange={onOtpChange} />);

      const inputs = screen.getAllByRole('textbox');
      fireEvent.change(inputs[0], { target: { value: '1' } });

      expect(onOtpChange).toHaveBeenCalledWith(0, '1');
    });

    it('should call onOtpKeyDown on keydown', () => {
      const onOtpKeyDown = vi.fn();
      render(<OtpVerificationStep {...defaultProps} onOtpKeyDown={onOtpKeyDown} />);

      const inputs = screen.getAllByRole('textbox');
      fireEvent.keyDown(inputs[0], { key: 'Backspace' });

      expect(onOtpKeyDown).toHaveBeenCalledWith(0, expect.objectContaining({ key: 'Backspace' }));
    });

    it('should display OTP values in inputs', () => {
      render(
        <OtpVerificationStep {...defaultProps} otp={['1', '2', '3', '4', '5', '6']} />
      );

      const inputs = screen.getAllByRole('textbox');
      expect(inputs[0]).toHaveValue('1');
      expect(inputs[5]).toHaveValue('6');
    });

    it('should disable inputs when loading', () => {
      render(<OtpVerificationStep {...defaultProps} isLoading={true} />);

      const inputs = screen.getAllByRole('textbox');
      inputs.forEach((input) => {
        expect(input).toBeDisabled();
      });
    });
  });

  // ==========================================
  // Submit Button Tests
  // ==========================================
  describe('Submit Button', () => {
    it('should disable submit button when OTP is incomplete', () => {
      render(<OtpVerificationStep {...defaultProps} otp={['1', '2', '3', '', '', '']} />);

      const button = screen.getByRole('button', { name: /verify code/i });
      expect(button).toBeDisabled();
    });

    it('should enable submit button when OTP is complete', () => {
      render(
        <OtpVerificationStep {...defaultProps} otp={['1', '2', '3', '4', '5', '6']} />
      );

      const button = screen.getByRole('button', { name: /verify code/i });
      expect(button).not.toBeDisabled();
    });

    it('should show loading state when submitting', () => {
      render(
        <OtpVerificationStep
          {...defaultProps}
          otp={['1', '2', '3', '4', '5', '6']}
          isLoading={true}
        />
      );

      expect(screen.getByText(/verifying/i)).toBeInTheDocument();
    });

    it('should call onSubmit when form is submitted', () => {
      const onSubmit = vi.fn((e) => e.preventDefault());
      render(
        <OtpVerificationStep
          {...defaultProps}
          otp={['1', '2', '3', '4', '5', '6']}
          onSubmit={onSubmit}
        />
      );

      const button = screen.getByRole('button', { name: /verify code/i });
      fireEvent.click(button);

      expect(onSubmit).toHaveBeenCalled();
    });
  });

  // ==========================================
  // Resend OTP Tests
  // ==========================================
  describe('Resend OTP', () => {
    it('should call onResendOtp when resend button clicked', () => {
      const onResendOtp = vi.fn();
      render(<OtpVerificationStep {...defaultProps} onResendOtp={onResendOtp} />);

      const resendButton = screen.getByRole('button', { name: /resend otp/i });
      fireEvent.click(resendButton);

      expect(onResendOtp).toHaveBeenCalled();
    });

    it('should disable resend button while resending', () => {
      render(<OtpVerificationStep {...defaultProps} isResending={true} />);

      const resendButton = screen.getByRole('button', { name: /sending/i });
      expect(resendButton).toBeDisabled();
    });

    it('should show "Sending..." text when resending', () => {
      render(<OtpVerificationStep {...defaultProps} isResending={true} />);

      expect(screen.getByText(/sending/i)).toBeInTheDocument();
    });
  });
});
