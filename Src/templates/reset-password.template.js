export const resetPasswordEmailTemplate = (name, resetUrl) => {
    return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #FF5A5F; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #FF5A5F; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Hi ${name},</h2>
            <p>We received a request to reset your password.</p>
            <p>Click the button below to choose a new password. This link will expire in 1 hour.</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p style="margin-top: 20px;">If you did not request a password reset, you can safely ignore this email.</p>
            <p style="margin-top: 30px;">Thanks,<br>The Airbnb Team</p>
          </div>
        </div>
      </body>
    </html>
  `;
};
