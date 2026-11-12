// Phase 0 stub: receives external event webhooks (calendar, Slack, ticket systems).
// Wire verification, routing, and OpenBot triggers in a later phase.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type, x-buddy-signature",
      },
    });
  }

  return new Response(
    JSON.stringify({
      ok: false,
      error: "buddy-event-webhook is not implemented (Phase 0 stub)",
    }),
    {
      status: 501,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    },
  );
});
