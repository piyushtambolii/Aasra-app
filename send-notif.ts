import { serve } from "https://deno.land/std/http/server.ts";

serve(async (req) => {
  const { token, title, body } = await req.json();

  const payload = {
    message: {
      token,
      notification: { title, body }
    }
  };

  const res = await fetch(
    "https://fcm.googleapis.com/v1/projects/YOUR_PROJECT_ID/messages:send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("FCM_SERVER_KEY")}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    }
  );

  return new Response(await res.text(), { status: res.status });
});
