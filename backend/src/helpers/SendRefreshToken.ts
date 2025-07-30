import { Response } from "express";

export const SendRefreshToken = (res: Response, token: string): void => {
  const isProduction = process.env.NODE_ENV === "production";
  
  // Configure domain for cookie - use dot notation for subdomain compatibility
  let cookieDomain = undefined;
  if (isProduction && process.env.COOKIE_DOMAIN) {
    // If COOKIE_DOMAIN starts with a dot, use as is, otherwise add dot for subdomain support
    cookieDomain = process.env.COOKIE_DOMAIN.startsWith('.') 
      ? process.env.COOKIE_DOMAIN 
      : `.${process.env.COOKIE_DOMAIN}`;
  }
  
  res.cookie("jrt", token, {
    httpOnly: true,
    secure: isProduction, // Only send over HTTPS in production
    sameSite: isProduction ? "lax" : "lax", // Changed from strict to lax for better compatibility
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/", // Available for all paths
    ...(cookieDomain && { domain: cookieDomain })
  });
};
