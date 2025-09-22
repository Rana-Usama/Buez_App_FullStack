// A very small "store" to keep messages in memory while the app is alive
export const chatCache = {
  data: {}, // will look like { [chatId]: [messages] }
};
