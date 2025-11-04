/**
 * send.js — Backend API for SOS Push Notifications
 * -------------------------------------------------
 * This endpoint receives POST { user_id } and sends a push
 * notification to all stored subscriptions for that user.
 *
 * Deploy this as a serverless function on:
 *   - Vercel (easiest)
 *   - Netlify Functions
 *   - Render or your Node.js server
 */

import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

// ----------------------
// 1. Environment setup
// ----------------------
// Make sure you have these in your deployment environment:
//   SUPABASE_URL
//   SUPABASE_SERVICE_KEY
//   VAPID_PUBLIC
//   VAPID_PRIVATE
//   EMAIL_CONTACT (optional)

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

webpush.setVapidDetails(
  `mailto:${process.env.EMAIL_CONTACT || "support@aasra.app"}`,
  process.env.VAPID_PUBLIC,
  process.env.VAPID_PRIVATE
);

// ----------------------
// 2. API Handler
// ----------------------
export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    // Parse JSON body safely
    let body = {};
    try {
      body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    } catch (err) {
      console.error("❌ Invalid JSON:", err);
      return res.status(400).json({ error: "Invalid JSON payload." });
    }

    const { user_id } = body;
    if (!user_id) {
      return res.status(400).json({ error: "Missing 'user_id' in request." });
    }

    // Fetch subscriptions from Supabase
    const { data: subs, error: subError } = await supabase
      .from("push_subscriptions")
      .select("subscription")
      .eq("user_id", user_id);

    if (subError) {
      console.error("❌ Supabase error:", subError);
      return res.status(500).json({ error: "Database fetch failed." });
    }

    if (!subs || subs.length === 0) {
      console.log(`⚠️ No push subscriptions found for user ${user_id}`);
      return res.status(200).json({ ok: true, message: "No subscribers." });
    }

    // Prepare payload
    const payload = JSON.stringify({
      title: "🚨 Aasra SOS Alert",
      body: "Emergency SOS triggered! Please check immediately.",
      tag: "sos-alert",
      requireInteraction: true,
      actions: [
        { action: "open", title: "Open App" },
        { action: "acknowledge", title: "Acknowledge" }
      ],
      data: { url: "/", type: "sos" }
    });

    // Send notifications to all user’s subscriptions
    const results = [];
    for (const s of subs) {
      try {
        const subscription = typeof s.subscription === "string"
          ? JSON.parse(s.subscription)
          : s.subscription;
        const response = await webpush.sendNotification(subscription, payload);
        results.push({ status: "sent", endpoint: subscription.endpoint });
      } catch (err) {
        console.error("❌ Push send failed:", err.message);
        results.push({ status: "failed", error: err.message });
      }
    }

    console.log(`✅ Sent SOS alert to ${results.length} subscriptions`);
    res.status(200).json({ ok: true, results });
  } catch (err) {
    console.error("❌ Unexpected error:", err);
    res.status(500).json({ error: err.message || "Unknown error" });
  }
}
