export const bookingCancellationTemplate = (guestName, listingTitle, location, checkIn, checkOut) => {
    return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #484848; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
          .booking-details { background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Booking Cancelled</h1>
          </div>
          <div class="content">
            <h2>Hi ${guestName},</h2>
            <p>Your booking has been successfully cancelled.</p>
            
            <div class="booking-details">
              <h3>${listingTitle}</h3>
              <p><strong>📍 Location:</strong> ${location}</p>
              <p><strong>Check-in:</strong> ${checkIn}</p>
              <p><strong>Check-out:</strong> ${checkOut}</p>
            </div>

            <p>Any applicable refunds will be processed according to the cancellation policy.</p>
            <p>We hope to host you again soon!</p>
            <p style="margin-top: 30px;">Best regards,<br>The Airbnb Team</p>
          </div>
        </div>
      </body>
    </html>
  `;
};
//# sourceMappingURL=booking-cancellation.template.js.map