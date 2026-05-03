export const bookingConfirmationTemplate = (guestName, listingTitle, location, checkIn, checkOut, nights, totalPrice) => {
    return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #00A699; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
          .booking-details { background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .total { font-size: 1.2em; font-weight: bold; color: #00A699; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Booking Confirmed!</h1>
          </div>
          <div class="content">
            <h2>Hi ${guestName}!</h2>
            <p>Great news! Your booking has been confirmed.</p>
            
            <div class="booking-details">
              <h3>${listingTitle}</h3>
              <p><strong>📍 Location:</strong> ${location}</p>
              
              <div class="detail-row">
                <span>Check-in:</span>
                <span><strong>${checkIn}</strong></span>
              </div>
              <div class="detail-row">
                <span>Check-out:</span>
                <span><strong>${checkOut}</strong></span>
              </div>
              <div class="detail-row">
                <span>Nights:</span>
                <span><strong>${nights}</strong></span>
              </div>
              <div class="detail-row total">
                <span>Total Price:</span>
                <span>$${totalPrice.toFixed(2)}</span>
              </div>
            </div>

            <p>We've sent the details to your host. You'll receive their contact information closer to your check-in date.</p>
            <p style="margin-top: 30px;">Have a wonderful stay!<br>The Airbnb Team</p>
          </div>
        </div>
      </body>
    </html>
  `;
};
//# sourceMappingURL=booking-confirmation.template.js.map