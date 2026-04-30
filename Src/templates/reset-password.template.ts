export const resetPasswordEmailTemplate = (name: string, resetUrl: string): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Reset Your Password</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f7f7f7; font-family: Arial, sans-serif; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background-color: #222222; padding: 32px; text-align: center; }
    .header h1 { margin: 0; color: #ffffff; font-size: 28px; letter-spacing: -0.5px; }
    .body { padding: 40px 36px; }
    .body h2 { color: #222222; font-size: 22px; margin-top: 0; }
    .body p { color: #555555; font-size: 15px; line-height: 1.7; }
    .cta { display: block; width: fit-content; margin: 28px auto; background-color: #FF385C; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: bold; }
    .warning-box { background-color: #fff8e1; border-left: 4px solid #f59e0b; padding: 14px 18px; border-radius: 4px; margin: 24px 0; }
    .warning-box p { margin: 0; color: #92400e; font-size: 13px; }
    .token-note { background-color: #f3f4f6; padding: 12px 16px; border-radius: 6px; font-size: 13px; color: #6b7280; word-break: break-all; margin-top: 16px; }
    .footer { background-color: #f7f7f7; padding: 20px 36px; text-align: center; }
    .footer p { color: #999999; font-size: 12px; margin: 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>✈️ Airbnb</h1>
    </div>
    <div class="body">
      <h2>Password Reset Request 🔐</h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p>We received a request to reset the password for your Airbnb account. Click the button below to choose a new password. This link is valid for <strong>1 hour</strong>.</p>
      <a class="cta" href="${resetUrl}">Reset My Password</a>
      <div class="warning-box">
        <p>⚠️ If you did not request a password reset, you can safely ignore this email. Your password will not change.</p>
      </div>
      <p style="font-size:13px; color:#999;">If the button above doesn't work, copy and paste this URL into your browser:</p>
      <div class="token-note">${resetUrl}</div>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Airbnb Clone · All rights reserved</p>
    </div>
  </div>
</body>
</html>
`;