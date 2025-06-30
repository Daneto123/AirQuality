// изпраща имейл до потребителите за замърсяване на въздуха в техният град
export function sendAlertEmail(userEmail, userCity) {

	const mailOptions = {
        from: 'alerts@example.com',
        to: userEmail,
        subject: 'Download last software for our sensors',
        text: `Dear patient,\n\n We want to inform you that in your city ${userCity} outside dust pollution is high level.`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
        console.error('Error sending email:', error);
        } else {
        console.log('Email sent:', info.response);
        }
    });

}

export function checkAirPollution() {

}