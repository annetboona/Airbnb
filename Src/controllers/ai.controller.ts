import type { Request, Response } from "express";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { JsonOutputParser, StringOutputParser } from "@langchain/core/output_parsers";
import { model as llm } from "../config/ai.js";
import prisma from "../config/prisma.js";
import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { RunnableWithMessageHistory } from "@langchain/core/runnables";

// ─── Natural Language Search ──────────────────────────────────────────────────

const searchPrompt = ChatPromptTemplate.fromTemplate(`
You are a search assistant for an Airbnb-like platform.
Extract search filters from the user's natural language query.

User query: {query}

Return a JSON object with these optional fields:
- location: string (city or area mentioned)
- type: one of APARTMENT, HOUSE, VILLA, CABIN (if mentioned)
- guests: number (max guests needed)
- maxPrice: number (maximum price per night in USD)

Return ONLY valid JSON. No explanation. No markdown. Example:
{{"location": "Miami", "type": "VILLA", "guests": 4, "maxPrice": 300}}

If a field is not mentioned, omit it from the JSON.
`);

const searchChain = searchPrompt.pipe(llm).pipe(new JsonOutputParser());

export async function naturalLanguageSearch(req: Request, res: Response) {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: "query is required" });
    }

    const filters = (await searchChain.invoke({ query })) as {
      location?: string;
      type?: string;
      guests?: number;
      maxPrice?: number;
    };

    const where: Record<string, unknown> = {};
    if (filters.location) where["location"] = { contains: filters.location, mode: "insensitive" };
    if (filters.type) where["type"] = filters.type;
    if (filters.guests) where["guests"] = { gte: filters.guests };
    if (filters.maxPrice) where["pricePerNight"] = { lte: filters.maxPrice };

    const listings = await prisma.listing.findMany({
      where,
      include: { host: { select: { name: true, avatar: true } } },
      take: 10,
    });

    return res.json({
      query,
      extractedFilters: filters,
      results: listings,
      count: listings.length,
    });
  } catch (error: any) {
    console.error("[AI] naturalLanguageSearch error:", error.message);
    return res.status(500).json({ error: "AI search failed. Please try again." });
  }
}

// ─── Listing Description Generator ───────────────────────────────────────────

const descriptionPrompt = ChatPromptTemplate.fromTemplate(`
You are a professional copywriter for an Airbnb-like platform.
Write an engaging, warm, and descriptive listing description.

Listing details:
- Title: {title}
- Location: {location}
- Type: {type}
- Max guests: {guests}
- Amenities: {amenities}
- Price per night: ${"{price}"} USD

Write a 3-paragraph description:
1. Opening hook — what makes this place special
2. The space — describe the property and its features
3. The location — what guests can do nearby

Keep it between 150-200 words. Be specific and inviting. Do not use generic phrases like "perfect getaway".
`);

const descriptionChain = descriptionPrompt.pipe(llm).pipe(new StringOutputParser());

export async function generateListingDescription(req: Request, res: Response) {
  try {
    const { title, location, type, guests, amenities, price } = req.body;

    if (!title || !location || !type || !guests || !amenities || !price) {
      return res.status(400).json({
        error: "title, location, type, guests, amenities, and price are all required",
      });
    }

    const description = await descriptionChain.invoke({
      title,
      location,
      type,
      guests,
      amenities: Array.isArray(amenities) ? amenities.join(", ") : amenities,
      price,
    });

    return res.json({ description });
  } catch (error: any) {
    console.error("[AI] generateListingDescription error:", error.message);
    return res.status(500).json({ error: "Description generation failed. Please try again." });
  }
}

// ─── Chatbot ──────────────────────────────────────────────────────────────────

/**
 * In-memory session store.
 * Fine for development — in production replace with Redis:
 *   const history = await redis.get(`chat:${sessionId}`) ...
 */
const sessionHistories = new Map<string, InMemoryChatMessageHistory>();

function getSessionHistory(sessionId: string): InMemoryChatMessageHistory {
  if (!sessionHistories.has(sessionId)) {
    sessionHistories.set(sessionId, new InMemoryChatMessageHistory());
  }
  return sessionHistories.get(sessionId)!;
}

const chatPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are a helpful Airbnb assistant. You help guests find listings, answer questions about properties, and assist with bookings.

Available listings context: {listingsContext}

Be friendly, concise, and helpful. If you don't know something, say so.
If asked about specific listings, refer to the context provided.`,
  ],
  ["placeholder", "{chat_history}"],
  ["human", "{input}"],
]);

const chainWithHistory = new RunnableWithMessageHistory({
  runnable: chatPrompt.pipe(llm),
  getMessageHistory: getSessionHistory,
  inputMessagesKey: "input",
  historyMessagesKey: "chat_history",
});

export async function chat(req: Request, res: Response) {
  try {
    const { message, sessionId } = req.body;

    if (!message || !sessionId) {
      return res.status(400).json({ error: "message and sessionId are required" });
    }

    // sessionId should be a short stable identifier, NOT a JWT token.
    // Good:  "user-2c67240c-session-1"
    // Bad:   an entire JWT string (leaks data, rotates every hour)
    if (sessionId.split(".").length === 3) {
      return res.status(400).json({
        error: "sessionId must be a stable identifier, not a JWT token. Use a UUID or user-id string.",
      });
    }

    const listings = await prisma.listing.findMany({
      take: 5,
      select: {
        title: true,
        location: true,
        pricePerNight: true,
        type: true,
        guests: true,
        amenities: true,
      },
    });

    const listingsContext = listings
      .map(
        (l) =>
          `- ${l.title} in ${l.location}: $${l.pricePerNight}/night, ${l.type}, up to ${l.guests} guests, amenities: ${l.amenities.join(", ")}`
      )
      .join("\n");

    const result = await chainWithHistory.invoke(
      { input: message, listingsContext },
      { configurable: { sessionId } }
    );

    // FIX: LangChain returns an AIMessage object. Extract the text content.
    const reply =
      typeof result === "string"
        ? result
        : typeof result.content === "string"
        ? result.content
        : JSON.stringify(result.content);

    return res.json({ reply, sessionId });
  } catch (error: any) {
    console.error("[AI] chat error:", error.message);
    return res.status(500).json({ error: "Chat failed. Please try again." });
  }
}