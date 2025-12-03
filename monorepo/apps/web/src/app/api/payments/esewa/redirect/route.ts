import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/payments/esewa/redirect
 * Generates an HTML page with auto-submitting form for eSewa
 * eSewa requires form POST submission, not API call
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // Get form data from query params
  const formUrl = searchParams.get('formUrl');
  const amount = searchParams.get('amount');
  const tax_amount = searchParams.get('tax_amount');
  const total_amount = searchParams.get('total_amount');
  const transaction_uuid = searchParams.get('transaction_uuid');
  const product_code = searchParams.get('product_code');
  const product_service_charge = searchParams.get('product_service_charge');
  const product_delivery_charge = searchParams.get('product_delivery_charge');
  const success_url = searchParams.get('success_url');
  const failure_url = searchParams.get('failure_url');
  const signed_field_names = searchParams.get('signed_field_names');
  const signature = searchParams.get('signature');

  if (!formUrl || !total_amount || !transaction_uuid || !product_code || !signature) {
    return new NextResponse('Missing required parameters', { status: 400 });
  }

  // Generate auto-submitting HTML form
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Redirecting to eSewa...</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #60bb46 0%, #4a9e3b 100%);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .container {
      text-align: center;
      background: white;
      padding: 2.5rem 2rem;
      border-radius: 1rem;
      box-shadow: 0 20px 60px rgba(0,0,0,0.2);
      max-width: 90%;
      width: 400px;
    }
    .logo {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #60bb46, #4a9e3b);
      border-radius: 50%;
      margin: 0 auto 1.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      font-weight: bold;
      color: white;
    }
    h1 {
      color: #333;
      font-size: 1.25rem;
      margin-bottom: 0.5rem;
    }
    p {
      color: #666;
      font-size: 0.875rem;
      margin-bottom: 1.5rem;
    }
    .amount {
      font-size: 1.5rem;
      font-weight: 700;
      color: #60bb46;
      margin-bottom: 1.5rem;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #e0e0e0;
      border-top-color: #60bb46;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .note {
      font-size: 0.75rem;
      color: #999;
    }
    noscript .btn {
      display: inline-block;
      background: linear-gradient(135deg, #60bb46, #4a9e3b);
      color: white;
      padding: 0.75rem 2rem;
      border-radius: 0.5rem;
      text-decoration: none;
      font-weight: 600;
      margin-top: 1rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">e</div>
    <h1>Redirecting to eSewa</h1>
    <p>Please wait while we securely connect you to eSewa payment gateway</p>
    <div class="amount">NPR ${total_amount}</div>
    <div class="spinner"></div>
    <p class="note">Do not close this window</p>

    <noscript>
      <p>JavaScript is required. Click the button below to continue:</p>
      <form action="${formUrl}" method="POST" style="margin-top: 1rem;">
        <input type="hidden" name="amount" value="${amount}" />
        <input type="hidden" name="tax_amount" value="${tax_amount}" />
        <input type="hidden" name="total_amount" value="${total_amount}" />
        <input type="hidden" name="transaction_uuid" value="${transaction_uuid}" />
        <input type="hidden" name="product_code" value="${product_code}" />
        <input type="hidden" name="product_service_charge" value="${product_service_charge}" />
        <input type="hidden" name="product_delivery_charge" value="${product_delivery_charge}" />
        <input type="hidden" name="success_url" value="${success_url}" />
        <input type="hidden" name="failure_url" value="${failure_url}" />
        <input type="hidden" name="signed_field_names" value="${signed_field_names}" />
        <input type="hidden" name="signature" value="${signature}" />
        <button type="submit" class="btn">Continue to eSewa</button>
      </form>
    </noscript>
  </div>

  <form id="esewaForm" action="${formUrl}" method="POST" style="display: none;">
    <input type="hidden" name="amount" value="${amount}" />
    <input type="hidden" name="tax_amount" value="${tax_amount}" />
    <input type="hidden" name="total_amount" value="${total_amount}" />
    <input type="hidden" name="transaction_uuid" value="${transaction_uuid}" />
    <input type="hidden" name="product_code" value="${product_code}" />
    <input type="hidden" name="product_service_charge" value="${product_service_charge}" />
    <input type="hidden" name="product_delivery_charge" value="${product_delivery_charge}" />
    <input type="hidden" name="success_url" value="${success_url}" />
    <input type="hidden" name="failure_url" value="${failure_url}" />
    <input type="hidden" name="signed_field_names" value="${signed_field_names}" />
    <input type="hidden" name="signature" value="${signature}" />
  </form>

  <script>
    // Auto-submit form after a brief delay for UX
    setTimeout(function() {
      document.getElementById('esewaForm').submit();
    }, 1500);
  </script>
</body>
</html>
  `;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}
