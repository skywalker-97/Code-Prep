function heuristicReview(code, language) {
  const tips = [];

  if (!code || code.trim().length < 20) {
    tips.push("Code is very short. Add full solution logic and edge-case handling.");
  }

  if (code.includes("console.log") || code.includes("print(")) {
    tips.push("Remove debug print statements before final submission.");
  }

  if (!/for|while|if|return/.test(code)) {
    tips.push("Control flow looks missing. Ensure solution has clear conditions and return value.");
  }

  if (language === "javascript" && code.includes("var ")) {
    tips.push("Prefer const/let over var for safer scoping.");
  }

  if (language === "python" && code.includes("global ")) {
    tips.push("Avoid global state where possible to prevent hidden side effects.");
  }

  if (tips.length === 0) {
    tips.push("Looks good structurally. Next step: optimize time/space complexity and test edge cases.");
  }

  return {
    provider: "heuristic",
    summary: "Fast static review completed.",
    suggestions: tips
  };
}

async function reviewWithOpenAI({ code, language, prompt }) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;

  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content: "You are an interview coding reviewer. Return concise JSON with keys summary and suggestions (array)."
        },
        {
          role: "user",
          content: `Language: ${language}\nTask: ${prompt || "Review and optimize"}\nCode:\n${code}`
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "review_response",
          schema: {
            type: "object",
            properties: {
              summary: { type: "string" },
              suggestions: {
                type: "array",
                items: { type: "string" }
              }
            },
            required: ["summary", "suggestions"],
            additionalProperties: false
          }
        }
      }
    })
  });

  if (!res.ok) {
    throw new Error(`OpenAI request failed with status ${res.status}`);
  }

  const data = await res.json();
  const text = data.output?.[0]?.content?.[0]?.text;
  if (!text) {
    throw new Error("OpenAI response parse failed");
  }

  const parsed = JSON.parse(text);
  return {
    provider: "openai",
    summary: parsed.summary,
    suggestions: parsed.suggestions || []
  };
}

async function reviewWithGemini({ code, language, prompt }) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;

  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `You are an interview coding reviewer. Reply in JSON object with keys summary (string) and suggestions (array of strings).\nLanguage: ${language}\nTask: ${prompt || "Review and optimize"}\nCode:\n${code}`
            }
          ]
        }
      ]
    })
  });

  if (!res.ok) {
    throw new Error(`Gemini request failed with status ${res.status}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini response parse failed");
  }

  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error("Gemini did not return JSON payload");
  }

  const parsed = JSON.parse(match[0]);
  return {
    provider: "gemini",
    summary: parsed.summary,
    suggestions: parsed.suggestions || []
  };
}

async function getCodeReview({ code, language, prompt }) {
  try {
    const openAiReview = await reviewWithOpenAI({ code, language, prompt });
    if (openAiReview) return openAiReview;
  } catch (err) {
    // Fallback below.
  }

  try {
    const geminiReview = await reviewWithGemini({ code, language, prompt });
    if (geminiReview) return geminiReview;
  } catch (err) {
    // Fallback below.
  }

  return heuristicReview(code, language);
}

module.exports = {
  getCodeReview
};
