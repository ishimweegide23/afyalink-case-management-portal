export function buildConversationId(userId1, userId2) {
  const sorted = [userId1, userId2].sort((a, b) => a - b);
  return `conv_${sorted[0]}_${sorted[1]}`;
}
