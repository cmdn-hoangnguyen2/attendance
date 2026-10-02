/** @param {string} topic */
export function createRealtimeChannelName(topic) {
  return `${topic}:${crypto.randomUUID()}`;
}
