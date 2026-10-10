export const clients = new Set();
export function broadcastUserCreated(user) {
  const eventData = JSON.stringify(user);

  for (const client of clients) {
    client.write("event: user-created\n");
    client.write(`data: ${eventData}\n\n`);
  }
}
