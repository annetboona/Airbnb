import { ChatGroq } from "@langchain/groq";

export const model = new ChatGroq({
  apiKey: process.env["GROQ_API_KEY"]!,
  model: "llama3-8b-8192",
  temperature: 0.7,
  
});