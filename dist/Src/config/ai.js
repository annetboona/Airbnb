import 'dotenv/config';
import { ChatGroq } from "@langchain/groq";
export const model = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: "llama-3.1-8b-instant",
    temperature: 0.7,
});
//# sourceMappingURL=ai.js.map