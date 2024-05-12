export const GenerateOtp = (otpLength = 4) => {
  // STRING INCLUDED OTP
  /* const constant = "aGSCc84MFBMAwCw9Vxrmpq4wTT0YEy202tz6OvTudhAAKPTOgKpMxd8edJPsed";
  let otp = '';

  for (let i = 1; i <= otpLength; i++) {
    var index = Math.floor(Math.random() * constant.length);

    otp = otp + constant[index];
  } */
  // STRING INCLUDED OTP

  // DIGIT OTP
  var digits = '0123456789';
  let otp = '';
  for (let i = 0; i < otpLength; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  // DIGIT OTP

  return otp.toString();
};
