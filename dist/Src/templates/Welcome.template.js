export const welcomeEmailTemplate = (name, roleMessage) => {
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
            <h1>Welcome to Airbnb! 🎉</h1>
          </div>
          <div class="content">
            <h2>Hi ${name}!</h2>
            <p>We're thrilled to have you join our community of travelers and hosts.</p>
            <p><strong>${roleMessage}</strong></p>
            <p>Here's what you can do:</p>
            <ul>
              <li>Browse thousands of unique properties</li>
              <li>Book your next adventure</li>
              <li>Connect with hosts around the world</li>
            </ul>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" class="button">Get Started</a>
            <p style="margin-top: 30px;">Happy travels!<br>The Airbnb Team</p>
          </div>
        </div>
      </body>
    </html>
  `;
};
//# sourceMappingURL=Welcome.template.js.map