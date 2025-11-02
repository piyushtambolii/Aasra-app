import webpush from "web-push";

webpush.setVapidDetails(
  "mailto:your@email.com",
  process.env.VAPID_PUBLIC,
  process.env.VAPID_PRIVATE
);

export default async function handler(req, res) {
  try {
    const { subscriptions, payload } = JSON.parse(req.body);

    for (const sub of subscriptions) {
      await webpush.sendNotification(sub, JSON.stringify(payload));
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Push error", err);
    res.status(500).json({ error: err.toString() });
  }
}
