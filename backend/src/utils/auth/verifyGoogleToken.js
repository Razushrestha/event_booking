const { isProduction } = require("../../config/env");

const GOOGLE_TOKEN_INFO_URL = "https://oauth2.googleapis.com/tokeninfo";

async function verifyGoogleIdToken(idToken) {
  if (!idToken) {
    throw new Error("Google ID token is required");
  }

  const response = await fetch(`${GOOGLE_TOKEN_INFO_URL}?id_token=${encodeURIComponent(idToken)}`);

  if (!response.ok) {
    throw new Error("Invalid Google ID token");
  }

  const payload = await response.json();
  const expectedAudience = process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLIENT_ID;

  if (expectedAudience && payload.aud !== expectedAudience) {
    throw new Error("Google token audience mismatch");
  }

  if (payload.email_verified !== "true" && payload.email_verified !== true) {
    throw new Error("Google email is not verified");
  }

  return {
    uid: payload.sub,
    email: payload.email?.toLowerCase(),
    name: payload.name || payload.email?.split("@")[0] || "User",
  };
}

async function resolveGoogleIdentity({ idToken, uid, email, fullName }) {
  const googleVerificationEnabled =
    isProduction || Boolean(process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLIENT_ID);

  if (idToken) {
    const verified = await verifyGoogleIdToken(idToken);

    if (uid && verified.uid !== uid) {
      throw new Error("Google UID does not match token");
    }

    if (email && verified.email !== email.toLowerCase()) {
      throw new Error("Google email does not match token");
    }

    return {
      uid: verified.uid,
      email: verified.email,
      fullName: fullName || verified.name,
    };
  }

  if (googleVerificationEnabled) {
    throw new Error("Google ID token is required");
  }

  if (!uid || !email) {
    throw new Error("Google UID and email are required");
  }

  return {
    uid,
    email: email.toLowerCase(),
    fullName,
  };
}

module.exports = {
  verifyGoogleIdToken,
  resolveGoogleIdentity,
};
