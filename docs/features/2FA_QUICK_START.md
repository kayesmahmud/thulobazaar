# 2FA Quick Start Guide

## How to Use the 2FA System

### For Super Admins

#### Enabling 2FA:

1. Navigate to Super Admin Settings
2. Find the "Edit Super Admin" button
3. In the edit modal, locate the "Two-Factor Authentication" toggle
4. Click the toggle to ON position
5. A QR code setup modal will appear

**Setup Modal Steps:**
1. Open Google Authenticator app on your phone
2. Tap "+" to add a new account
3. Scan the QR code displayed on screen
4. Enter the 6-digit code shown in the app
5. Click "Verify & Enable"

6. Save your backup codes! (IMPORTANT)
   - 10 backup codes will be displayed
   - Click "Copy Codes" to copy all codes
   - Save them in a secure location (password manager, encrypted file, etc.)
   - These codes can be used if you lose your phone

#### Disabling 2FA:

1. Navigate to Super Admin Settings
2. Click "Edit Super Admin"
3. Toggle 2FA to OFF position
4. Confirm the action
5. 2FA is immediately disabled

---

## For Developers

### Backend API Endpoints

#### 1. Setup 2FA
```bash
POST /api/editor/super-admins/:id/2fa/setup
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "secret": "JBSWY3DPEHPK3PXP...",
    "qrCode": "data:image/png;base64,iVBORw0KG..."
  }
}
```

#### 2. Verify & Enable 2FA
```bash
POST /api/editor/super-admins/:id/2fa/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "secret": "JBSWY3DPEHPK3PXP...",
  "token": "123456"
}

Response:
{
  "success": true,
  "data": {
    "backupCodes": [
      "1A2B3C4D",
      "5E6F7G8H",
      ...
    ]
  },
  "message": "2FA enabled successfully"
}
```

#### 3. Disable 2FA
```bash
POST /api/editor/super-admins/:id/2fa/disable
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "2FA disabled successfully"
}
```

### Frontend Usage

```typescript
import { apiClient } from '@/lib/api';

// Setup 2FA
const setupResponse = await apiClient.setup2FA(userId);
const { secret, qrCode } = setupResponse.data;

// Verify code
const verifyResponse = await apiClient.verify2FA(userId, {
  secret: secret,
  token: '123456'
});
const backupCodes = verifyResponse.data.backupCodes;

// Disable 2FA
await apiClient.disable2FA(userId);
```

---

## Testing

### Manual Testing Steps:

1. **Setup Test:**
   - Open super admin management
   - Enable 2FA for a test admin
   - Verify QR code displays
   - Scan with Google Authenticator
   - Enter code and verify it works

2. **Verification Test:**
   - Try correct code (should succeed)
   - Try incorrect code (should fail)
   - Try old code (should fail - 30 second window)

3. **Backup Codes Test:**
   - Verify 10 codes are generated
   - Verify all codes are unique
   - Copy codes and verify clipboard content

4. **Disable Test:**
   - Disable 2FA
   - Verify confirmation dialog appears
   - Confirm and verify 2FA is disabled

### Automated Testing:

```javascript
// Backend test example
describe('2FA Endpoints', () => {
  test('should generate QR code', async () => {
    const response = await request(app)
      .post('/api/editor/super-admins/1/2fa/setup')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.secret).toBeDefined();
    expect(response.body.data.qrCode).toContain('data:image/png');
  });

  test('should verify valid code', async () => {
    const secret = 'test-secret';
    const token = speakeasy.totp({ secret, encoding: 'base32' });

    const response = await request(app)
      .post('/api/editor/super-admins/1/2fa/verify')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ secret, token });

    expect(response.status).toBe(200);
    expect(response.body.data.backupCodes).toHaveLength(10);
  });
});
```

---

## Troubleshooting

### QR Code Not Scanning
- Ensure QR code image is fully loaded
- Try increasing screen brightness
- Use manual entry option with the secret key

### Invalid Verification Code
- Ensure phone time is synchronized
- Code expires every 30 seconds
- Check for typos in 6-digit code

### Cannot Disable 2FA
- Ensure you have proper permissions (root or self)
- Check network connection
- Verify authentication token is valid

### Backup Codes Not Saving
- Use "Copy Codes" button
- Manually copy codes if clipboard fails
- Screenshot the modal (delete after saving securely)

---

## Security Best Practices

### For Users:
1. Never share your 2FA secret key
2. Store backup codes in a secure password manager
3. Don't screenshot backup codes (or delete immediately after saving)
4. Enable 2FA on all super admin accounts
5. Keep phone's Google Authenticator app backed up

### For Developers:
1. Never log secrets or backup codes
2. Use HTTPS in production
3. Implement rate limiting on verification endpoints
4. Monitor for suspicious 2FA disable attempts
5. Ensure database columns are properly encrypted

---

## Common Use Cases

### Lost Phone
1. Use one of your 10 backup codes to login
2. Disable 2FA
3. Get new phone or reinstall Google Authenticator
4. Re-enable 2FA with new QR code
5. Save new backup codes

### New Phone
1. Transfer Google Authenticator to new phone OR
2. Disable and re-enable 2FA with new device

### Multiple Admins
Each admin should:
1. Enable 2FA individually
2. Use their own Google Authenticator account
3. Store their own backup codes securely

---

## Related Files

- Backend: `/Users/elw/Documents/Web/thulobazaar/backend/routes/editor.js` (lines 1632-1792)
- API Client: `/Users/elw/Documents/Web/thulobazaar/monorepo/packages/api-client/src/index.ts`
- UI Component: `/Users/elw/Documents/Web/thulobazaar/monorepo/apps/web/src/components/admin/EditSuperAdminModal.tsx`

---

## Additional Resources

- [Google Authenticator](https://support.google.com/accounts/answer/1066447)
- [TOTP RFC 6238](https://tools.ietf.org/html/rfc6238)
- [Speakeasy Documentation](https://github.com/speakeasyjs/speakeasy)
- [QRCode.js Documentation](https://github.com/soldair/node-qrcode)
