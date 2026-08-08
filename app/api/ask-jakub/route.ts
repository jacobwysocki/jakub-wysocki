import { createConfiguredModel } from "@/features/ask-jakub/server/configured-model";
import { createAskJakubRoute } from "@/features/ask-jakub/server/http-route";

export const dynamic = "force-dynamic";

export const POST = createAskJakubRoute(
  createConfiguredModel({
    ASK_JAKUB_PROVIDER: process.env.ASK_JAKUB_PROVIDER,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
  }),
);
