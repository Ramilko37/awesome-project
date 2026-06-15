export async function POST() {
  return Response.json(
    { status: "ok" },
    {
      headers: {
        "Set-Cookie": "access-token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",
      },
    },
  );
}
