import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PaymentMethodSelector from '@/components/payment/PaymentMethodSelector';

describe('PaymentMethodSelector', () => {
  const defaultProps = {
    selectedMethod: null,
    onSelect: vi.fn(),
    amount: 100,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================
  // Rendering Tests
  // ==========================================
  describe('Rendering', () => {
    it('should render both payment method options', () => {
      render(<PaymentMethodSelector {...defaultProps} />);

      expect(screen.getByText('Khalti')).toBeInTheDocument();
      expect(screen.getByText('eSewa')).toBeInTheDocument();
    });

    it('should render payment method header', () => {
      render(<PaymentMethodSelector {...defaultProps} />);

      expect(screen.getByText('Select Payment Method')).toBeInTheDocument();
    });

    it('should show secure indicator', () => {
      render(<PaymentMethodSelector {...defaultProps} />);

      expect(screen.getByText('Secure')).toBeInTheDocument();
    });

    it('should show SSL encryption badge', () => {
      render(<PaymentMethodSelector {...defaultProps} />);

      expect(screen.getByText('256-bit SSL Encrypted')).toBeInTheDocument();
    });

    it('should display taglines for payment methods', () => {
      render(<PaymentMethodSelector {...defaultProps} />);

      expect(screen.getByText('Digital Wallet & Banking')).toBeInTheDocument();
      expect(screen.getByText("Nepal's First Digital Wallet")).toBeInTheDocument();
    });
  });

  // ==========================================
  // Selection Tests
  // ==========================================
  describe('Selection', () => {
    it('should call onSelect when Khalti is clicked', () => {
      const onSelect = vi.fn();
      render(<PaymentMethodSelector {...defaultProps} onSelect={onSelect} />);

      const khaltiButton = screen.getByText('Khalti').closest('button');
      fireEvent.click(khaltiButton!);

      expect(onSelect).toHaveBeenCalledWith('khalti');
    });

    it('should call onSelect when eSewa is clicked', () => {
      const onSelect = vi.fn();
      render(<PaymentMethodSelector {...defaultProps} onSelect={onSelect} />);

      const esewaButton = screen.getByText('eSewa').closest('button');
      fireEvent.click(esewaButton!);

      expect(onSelect).toHaveBeenCalledWith('esewa');
    });

    it('should show checkmark when Khalti is selected', () => {
      render(
        <PaymentMethodSelector {...defaultProps} selectedMethod="khalti" />
      );

      // The selected method should have a green checkmark (tested via visual indicator)
      const khaltiSection = screen.getByText('Khalti').closest('button');
      expect(khaltiSection).toHaveClass('border-purple-500');
    });

    it('should show checkmark when eSewa is selected', () => {
      render(
        <PaymentMethodSelector {...defaultProps} selectedMethod="esewa" />
      );

      const esewaSection = screen.getByText('eSewa').closest('button');
      expect(esewaSection).toHaveClass('border-green-500');
    });
  });

  // ==========================================
  // Amount Display Tests
  // ==========================================
  describe('Amount Display', () => {
    it('should display amount when method is selected', () => {
      render(
        <PaymentMethodSelector
          {...defaultProps}
          selectedMethod="khalti"
          amount={500}
        />
      );

      expect(screen.getByText('Amount to Pay')).toBeInTheDocument();
      expect(screen.getByText('NPR 500')).toBeInTheDocument();
    });

    it('should format large amounts with comma separators', () => {
      render(
        <PaymentMethodSelector
          {...defaultProps}
          selectedMethod="khalti"
          amount={10000}
        />
      );

      expect(screen.getByText('NPR 10,000')).toBeInTheDocument();
    });

    it('should not display amount when no method is selected', () => {
      render(
        <PaymentMethodSelector
          {...defaultProps}
          selectedMethod={null}
          amount={500}
        />
      );

      expect(screen.queryByText('Amount to Pay')).not.toBeInTheDocument();
    });

    it('should not display amount when amount is 0', () => {
      render(
        <PaymentMethodSelector
          {...defaultProps}
          selectedMethod="khalti"
          amount={0}
        />
      );

      expect(screen.queryByText('Amount to Pay')).not.toBeInTheDocument();
    });
  });

  // ==========================================
  // Disabled State Tests
  // ==========================================
  describe('Disabled State', () => {
    it('should not call onSelect when disabled', () => {
      const onSelect = vi.fn();
      render(
        <PaymentMethodSelector
          {...defaultProps}
          onSelect={onSelect}
          disabled={true}
        />
      );

      const khaltiButton = screen.getByText('Khalti').closest('button');
      fireEvent.click(khaltiButton!);

      expect(onSelect).not.toHaveBeenCalled();
    });

    it('should disable buttons when disabled prop is true', () => {
      render(
        <PaymentMethodSelector {...defaultProps} disabled={true} />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });

    it('should show reduced opacity when disabled', () => {
      render(
        <PaymentMethodSelector {...defaultProps} disabled={true} />
      );

      const khaltiButton = screen.getByText('Khalti').closest('button');
      expect(khaltiButton).toHaveClass('opacity-50');
    });
  });

  // ==========================================
  // Test Credentials Display Tests
  // ==========================================
  describe('Test Credentials', () => {
    it('should show test credentials when showTestInfo is true and method is selected', () => {
      render(
        <PaymentMethodSelector
          {...defaultProps}
          selectedMethod="khalti"
          showTestInfo={true}
        />
      );

      expect(screen.getByText('Sandbox Test Credentials')).toBeInTheDocument();
      expect(screen.getByText(/9800000000-9800000005/)).toBeInTheDocument();
    });

    it('should not show test credentials when showTestInfo is false', () => {
      render(
        <PaymentMethodSelector
          {...defaultProps}
          selectedMethod="khalti"
          showTestInfo={false}
        />
      );

      expect(screen.queryByText('Sandbox Test Credentials')).not.toBeInTheDocument();
    });

    it('should show eSewa test credentials when eSewa is selected', () => {
      render(
        <PaymentMethodSelector
          {...defaultProps}
          selectedMethod="esewa"
          showTestInfo={true}
        />
      );

      expect(screen.getByText('Sandbox Test Credentials')).toBeInTheDocument();
      expect(screen.getByText(/9806800001-9806800005/)).toBeInTheDocument();
      expect(screen.getByText(/Nepal@123/)).toBeInTheDocument();
    });

    it('should not show test credentials when no method is selected', () => {
      render(
        <PaymentMethodSelector
          {...defaultProps}
          selectedMethod={null}
          showTestInfo={true}
        />
      );

      expect(screen.queryByText('Sandbox Test Credentials')).not.toBeInTheDocument();
    });
  });

  // ==========================================
  // Feature Display Tests
  // ==========================================
  describe('Features', () => {
    it('should display Khalti features', () => {
      render(<PaymentMethodSelector {...defaultProps} />);

      // Features appear in both mobile and desktop views, so use getAllByText
      expect(screen.getAllByText('Khalti Wallet').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Mobile Banking').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Connect IPS').length).toBeGreaterThan(0);
    });

    it('should display eSewa features', () => {
      render(<PaymentMethodSelector {...defaultProps} />);

      // Features appear in both mobile and desktop views
      expect(screen.getAllByText('eSewa Wallet').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Bank Transfer').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Quick Pay').length).toBeGreaterThan(0);
    });
  });
});
