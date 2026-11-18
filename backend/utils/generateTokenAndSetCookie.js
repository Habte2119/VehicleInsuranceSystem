// import jwt from "jsonwebtoken";

// export const generateTokenAndSetCookie = (res, user) => {
//   const tokenPayload = {
//     userId: user.id,
//     role: user.role,
//     isVerified: user.isVerified,
//     email: user.email, // For potential email-based operations
//   };

//   const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
//     expiresIn: "7d",
//     issuer: "your-insurance-app", // Good practice for JWT
//   });

//   res.cookie("token", token, {
//     httpOnly: true,
//     secure: process.env.NODE_ENV === "production",
//     sameSite: "Lax", // Changed from strict for better cross-site compatibility
//     path: "/",
//     maxAge: 7 * 24 * 60 * 60 * 1000,
//     domain: process.env.COOKIE_DOMAIN || undefined, // For production
//   });

//   return token;
// };
import jwt from "jsonwebtoken";

export const generateTokenAndSetCookie = (res, user, rememberMe = false) => {
  if (!user?.id) {
    throw new Error("User ID is required for token generation");
  }

  const tokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
    iss: "your-insurance-app",
    iat: Math.floor(Date.now() / 1000),
  };

  // If user selected "Remember Me" / "Save Account", maintain session for 30 days
  const expiresIn = rememberMe ? "30d" : "7d";
  const maxAge = rememberMe
    ? 30 * 24 * 60 * 60 * 1000 // 30 days
    : 7 * 24 * 60 * 60 * 1000;  // 7 days

  const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
    expiresIn,
  });

  // Set cookie with secure options
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
    path: "/",
    maxAge,
    domain: process.env.COOKIE_DOMAIN || undefined,
  });

  return token;
};
