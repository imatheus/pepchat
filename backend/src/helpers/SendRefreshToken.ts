import { Response } from "express";

export const SendRefreshToken = (res: Response, token: string): void => {
  const isProduction = process.env.NODE_ENV === "production";
  
  res.cookie("jrt", token, {
    httpOnly: true,
    secure: isProduction, // Only send over HTTPS in production
    sameSite: isProduction ? "strict" : "lax", // Strict in production, lax in development
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/", // Available for all paths
    ...(isProduction && {
      domain: process.env.COOKIE_DOMAIN || undefined // Set domain for production if needed
    })
  });
};
