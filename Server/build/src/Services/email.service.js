"use strict";var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");Object.defineProperty(exports, "__esModule", { value: true });exports.sendOTPEmail = void 0;var _nodemailer = _interopRequireDefault(require("nodemailer"));
var _dotenv = _interopRequireDefault(require("dotenv"));

_dotenv.default.config();

const transporter = _nodemailer.default.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

const sendOTPEmail = async (email, otp) => {
  try {
    const mailOptions = {
      from: `"Quản Lý Thực Phẩm" <${process.env.EMAIL_USERNAME}>`,
      to: email,
      subject: "Mã OTP Đặt Lại Mật Khẩu",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Mã OTP Đặt Lại Mật Khẩu</h2>
          <p>Mã OTP của bạn là: <strong style="font-size: 1.5rem; color: #dc2626;">${otp}</strong></p>
          <p>Mã có hiệu lực trong 15 phút.</p>
          <p style="color: #ef4444; font-weight: bold;">Không chia sẻ mã này với bất kỳ ai.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully to:", email);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Không thể gửi email xác nhận");
  }
};exports.sendOTPEmail = sendOTPEmail;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfbm9kZW1haWxlciIsIl9pbnRlcm9wUmVxdWlyZURlZmF1bHQiLCJyZXF1aXJlIiwiX2RvdGVudiIsImRvdGVudiIsImNvbmZpZyIsInRyYW5zcG9ydGVyIiwibm9kZW1haWxlciIsImNyZWF0ZVRyYW5zcG9ydCIsInNlcnZpY2UiLCJob3N0IiwicG9ydCIsInNlY3VyZSIsImF1dGgiLCJ1c2VyIiwicHJvY2VzcyIsImVudiIsIkVNQUlMX1VTRVJOQU1FIiwicGFzcyIsIkVNQUlMX1BBU1NXT1JEIiwidGxzIiwicmVqZWN0VW5hdXRob3JpemVkIiwic2VuZE9UUEVtYWlsIiwiZW1haWwiLCJvdHAiLCJtYWlsT3B0aW9ucyIsImZyb20iLCJ0byIsInN1YmplY3QiLCJodG1sIiwic2VuZE1haWwiLCJjb25zb2xlIiwibG9nIiwiZXJyb3IiLCJFcnJvciIsImV4cG9ydHMiXSwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvU2VydmljZXMvZW1haWwuc2VydmljZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgbm9kZW1haWxlciBmcm9tIFwibm9kZW1haWxlclwiO1xuaW1wb3J0IGRvdGVudiBmcm9tIFwiZG90ZW52XCI7XG5cbmRvdGVudi5jb25maWcoKTtcblxuY29uc3QgdHJhbnNwb3J0ZXIgPSBub2RlbWFpbGVyLmNyZWF0ZVRyYW5zcG9ydCh7XG4gIHNlcnZpY2U6IFwiZ21haWxcIixcbiAgaG9zdDogXCJzbXRwLmdtYWlsLmNvbVwiLFxuICBwb3J0OiA1ODcsXG4gIHNlY3VyZTogZmFsc2UsXG4gIGF1dGg6IHtcbiAgICB1c2VyOiBwcm9jZXNzLmVudi5FTUFJTF9VU0VSTkFNRSxcbiAgICBwYXNzOiBwcm9jZXNzLmVudi5FTUFJTF9QQVNTV09SRCxcbiAgfSxcbiAgdGxzOiB7XG4gICAgcmVqZWN0VW5hdXRob3JpemVkOiBmYWxzZSxcbiAgfSxcbn0pO1xuXG5leHBvcnQgY29uc3Qgc2VuZE9UUEVtYWlsID0gYXN5bmMgKGVtYWlsLCBvdHApID0+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCBtYWlsT3B0aW9ucyA9IHtcbiAgICAgIGZyb206IGBcIlF14bqjbiBMw70gVGjhu7FjIFBo4bqpbVwiIDwke3Byb2Nlc3MuZW52LkVNQUlMX1VTRVJOQU1FfT5gLFxuICAgICAgdG86IGVtYWlsLFxuICAgICAgc3ViamVjdDogXCJNw6MgT1RQIMSQ4bq3dCBM4bqhaSBN4bqtdCBLaOG6qXVcIixcbiAgICAgIGh0bWw6IGBcbiAgICAgICAgPGRpdiBzdHlsZT1cImZvbnQtZmFtaWx5OiBBcmlhbCwgc2Fucy1zZXJpZjsgbWF4LXdpZHRoOiA2MDBweDsgbWFyZ2luOiAwIGF1dG87XCI+XG4gICAgICAgICAgPGgyIHN0eWxlPVwiY29sb3I6ICMyNTYzZWI7XCI+TcOjIE9UUCDEkOG6t3QgTOG6oWkgTeG6rXQgS2jhuql1PC9oMj5cbiAgICAgICAgICA8cD5Nw6MgT1RQIGPhu6dhIGLhuqFuIGzDoDogPHN0cm9uZyBzdHlsZT1cImZvbnQtc2l6ZTogMS41cmVtOyBjb2xvcjogI2RjMjYyNjtcIj4ke290cH08L3N0cm9uZz48L3A+XG4gICAgICAgICAgPHA+TcOjIGPDsyBoaeG7h3UgbOG7sWMgdHJvbmcgMTUgcGjDunQuPC9wPlxuICAgICAgICAgIDxwIHN0eWxlPVwiY29sb3I6ICNlZjQ0NDQ7IGZvbnQtd2VpZ2h0OiBib2xkO1wiPktow7RuZyBjaGlhIHPhursgbcOjIG7DoHkgduG7m2kgYuG6pXQga+G7syBhaS48L3A+XG4gICAgICAgIDwvZGl2PlxuICAgICAgYCxcbiAgICB9O1xuXG4gICAgYXdhaXQgdHJhbnNwb3J0ZXIuc2VuZE1haWwobWFpbE9wdGlvbnMpO1xuICAgIGNvbnNvbGUubG9nKFwiRW1haWwgc2VudCBzdWNjZXNzZnVsbHkgdG86XCIsIGVtYWlsKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKFwiRXJyb3Igc2VuZGluZyBlbWFpbDpcIiwgZXJyb3IpO1xuICAgIHRocm93IG5ldyBFcnJvcihcIktow7RuZyB0aOG7gyBn4butaSBlbWFpbCB4w6FjIG5o4bqtblwiKTtcbiAgfVxufTtcbiJdLCJtYXBwaW5ncyI6IjhMQUFBLElBQUFBLFdBQUEsR0FBQUMsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFDLE9BQUEsR0FBQUYsc0JBQUEsQ0FBQUMsT0FBQTs7QUFFQUUsZUFBTSxDQUFDQyxNQUFNLENBQUMsQ0FBQzs7QUFFZixNQUFNQyxXQUFXLEdBQUdDLG1CQUFVLENBQUNDLGVBQWUsQ0FBQztFQUM3Q0MsT0FBTyxFQUFFLE9BQU87RUFDaEJDLElBQUksRUFBRSxnQkFBZ0I7RUFDdEJDLElBQUksRUFBRSxHQUFHO0VBQ1RDLE1BQU0sRUFBRSxLQUFLO0VBQ2JDLElBQUksRUFBRTtJQUNKQyxJQUFJLEVBQUVDLE9BQU8sQ0FBQ0MsR0FBRyxDQUFDQyxjQUFjO0lBQ2hDQyxJQUFJLEVBQUVILE9BQU8sQ0FBQ0MsR0FBRyxDQUFDRztFQUNwQixDQUFDO0VBQ0RDLEdBQUcsRUFBRTtJQUNIQyxrQkFBa0IsRUFBRTtFQUN0QjtBQUNGLENBQUMsQ0FBQzs7QUFFSyxNQUFNQyxZQUFZLEdBQUcsTUFBQUEsQ0FBT0MsS0FBSyxFQUFFQyxHQUFHLEtBQUs7RUFDaEQsSUFBSTtJQUNGLE1BQU1DLFdBQVcsR0FBRztNQUNsQkMsSUFBSSxFQUFFLHdCQUF3QlgsT0FBTyxDQUFDQyxHQUFHLENBQUNDLGNBQWMsR0FBRztNQUMzRFUsRUFBRSxFQUFFSixLQUFLO01BQ1RLLE9BQU8sRUFBRSx5QkFBeUI7TUFDbENDLElBQUksRUFBRTtBQUNaO0FBQ0E7QUFDQSxxRkFBcUZMLEdBQUc7QUFDeEY7QUFDQTtBQUNBO0FBQ0E7SUFDSSxDQUFDOztJQUVELE1BQU1sQixXQUFXLENBQUN3QixRQUFRLENBQUNMLFdBQVcsQ0FBQztJQUN2Q00sT0FBTyxDQUFDQyxHQUFHLENBQUMsNkJBQTZCLEVBQUVULEtBQUssQ0FBQztFQUNuRCxDQUFDLENBQUMsT0FBT1UsS0FBSyxFQUFFO0lBQ2RGLE9BQU8sQ0FBQ0UsS0FBSyxDQUFDLHNCQUFzQixFQUFFQSxLQUFLLENBQUM7SUFDNUMsTUFBTSxJQUFJQyxLQUFLLENBQUMsOEJBQThCLENBQUM7RUFDakQ7QUFDRixDQUFDLENBQUNDLE9BQUEsQ0FBQWIsWUFBQSxHQUFBQSxZQUFBIiwiaWdub3JlTGlzdCI6W119