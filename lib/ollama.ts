import { Ollama } from "ollama";

// Initialize Ollama Cloud with native SDK
export const ollama = new Ollama({
	host: "https://ollama.com",
	headers: {
		Authorization: `Bearer ${process.env.OLLAMA_API_KEY}`,
	},
});

// Export the model name used by Ollama Cloud
export const MODEL_NAME = "mistral-large-3:675b-cloud";
