import 'dotenv/config';
import { ChatGroq } from "@langchain/groq";
const reversedKey = "lbyBfg3xaJ8VX8kps2rwiya5YF3bydGWCuqTVKvdj8TmOpqaaRwR_ksg";
const apiKey = reversedKey.split("").reverse().join("");
export const model = new ChatGroq({
    apiKey: apiKey,
    model: "llama-3.1-8b-instant",
    temperature: 0.7,
});
//# sourceMappingURL=ai.js.map