import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);


webpush.setVapidDetails(
  "mailto:your@email.com",
  process.env.VAPID_PUBLIC,
  process.env.VAPID_PRIVATE
);

export default async function handler(req, res) {
  const { user_id } = JSON.parse(req.body);

  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("subscription")
    .eq("user_id", user_id);

  const payload = {
    title: "Aasra Emergency Alert",
    body: "SOS triggered. Please check immediately."
  };

  try {
    for (const s of subs) {
      await webpush.sendNotification(s.subscription, JSON.stringify(payload));
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.toString() });
  }
}
