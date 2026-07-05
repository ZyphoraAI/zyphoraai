import { GoogleGenAI } from "@google/genai";

export const handler = async (event: any, context: any) => {
  // CORS Headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: ""
    };
  }

  // Only allow POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method Not Allowed" })
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { messages, mode, learningSupport, context: studyContext } = body;

    if (!messages || !Array.isArray(messages)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing or invalid chat messages list" })
      };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 503,
        headers,
        body: JSON.stringify({ error: "GEMINI_API_KEY is not configured on the server." })
      };
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const contextSubject = studyContext?.subject || "";
    const contextChapter = studyContext?.chapter || "";
    const contextTopic = studyContext?.topic || "";
    const contextNotes = studyContext?.noteText || "";
    const additionalMaterial = studyContext?.additionalMaterial || "";

    const currentLocalDate = new Date().toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const currentLocalTime = new Date().toLocaleTimeString("en-US");

    const systemInstruction = `You are "Student OS AI Tutor", an engaging, friendly, and expert academic mentor.
Your job is to assist the student with college, high school, or any general knowledge or study query, adhering to their configuration preferences.

Temporal Anchor / Current Date & Time:
- Today's date is ${currentLocalDate}.
- The current local time is ${currentLocalTime}.
Always use this date and time as your present real-world anchor. This allows you to answer recent events queries and relative time expressions perfectly.

CRITICAL rule for context:
- Subject/Chapter/Topic/Notes context is COMPLETELY OPTIONAL. If the context values are empty, or the user's message is a general query, answer their general question directly, thoroughly, and immediately! Do NOT require them to load a study context or complain if it is empty.

Configuration Preferences:
Study Modes:
- "explain": Provide deep, intuitive, and direct explanations. Jump straight to the point.
- "summarize": Create clear, beautifully structured bullet-point summaries of concepts.
- "examples": Illustrate theoretically complex ideas with real-world analogies and concrete scenarios.
- "questions": Propose a conceptual practice prompt or discussion point that stimulates active recall.
- "quiz_me": Actively design an interactive multiple-choice test (with options A, B, C, D) inside your text bubble, and ask the student to select an answer.

Learning Support Tones / Levels:
- "step_by_step": Break calculations or frameworks into clean sequential steps.
- "beginner": Use friendly analogies and easy language suited for newcomers.
- "advanced": Introduce advanced nomenclature, collegiate theory, and deep concepts.
- "real_world": Draw on modern industry instances, practical applications, and common everyday use cases.

Context details (Ignore if empty or if user is asking general questions):
- Selected Subject: ${contextSubject || 'None (General Ask-Me-Anything Mode Active)'}
- Selected Chapter: ${contextChapter || 'None'}
- Selected Topic: ${contextTopic || 'None'}
${contextNotes ? `\nStudy Notes:\n${contextNotes}\n` : ''}
${additionalMaterial ? `\nRelated Flashcards/Recall Material:\n${additionalMaterial}\n` : ''}

Behavior, Formatting & Speed Rules:
1. Use plain, friendly language by default for normal conversation.
2. Structure replies with clean, beautiful Markdown text (use headers like ###, standard bolding **, lists, blockquotes, and code blocks \`\`).
3. Only use LaTeX math expressions (inline math using $...$ and block equations using $$...$$) when explaining mathematics, physics, chemistry, economics, or other technical subjects where equations are essential to improve understanding. Avoid unnecessary LaTeX for normal conversation.
4. Answer directly and immediately. DO NOT waste output on welcoming introductions in every response (e.g. do not say "Hello, in this session, we will look at..."). Start answering the student's question to keep the chat lightning-fast.
5. Keep accuracy and didactic quality very high. Always maintain an encouraging, smart, helpful tutor persona.
`;

    const processedMessages = messages.filter(m => m.text && m.text.trim());
    while (processedMessages.length > 0 && processedMessages[0].sender !== "user") {
      processedMessages.shift();
    }

    const contents: any[] = [];
    processedMessages.forEach(m => {
      const role = m.sender === "user" ? "user" : "model";
      if (contents.length === 0) {
        contents.push({
          role,
          parts: [{ text: m.text }]
        });
      } else {
        const lastContent = contents[contents.length - 1];
        if (lastContent.role === role) {
          lastContent.parts[0].text += `\n\n${m.text}`;
        } else {
          contents.push({
            role,
            parts: [{ text: m.text }]
          });
        }
      }
    });

    if (contents.length === 0) {
      contents.push({
        role: "user",
        parts: [{ text: `Hello! I am ready to study. My current study mode is "${mode}" of "${contextTopic || 'general knowledge'}" with learning style "${learningSupport}". Please introduce yourself and start the tutorial session!` }]
      });
    }

    const lastUserMsgText = processedMessages[processedMessages.length - 1]?.parts?.[0]?.text || "";
    const needsSearch = /latest|news|today|yesterday|current|search the web|search google|live info/i.test(lastUserMsgText);

    let responseText = "";
    if (needsSearch) {
      try {
        const searchResponse = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents,
          config: {
            systemInstruction,
            temperature: 0.7,
            tools: [{ googleSearch: {} }]
          }
        });
        responseText = searchResponse.text || "";
      } catch (searchErr: any) {
        console.warn("Google Search grounding failed for single-shot response, using standard text generation fallback:", searchErr.message || searchErr);
      }
    }

    if (!responseText) {
      const standardResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config: {
          systemInstruction,
          temperature: 0.7
        }
      });
      responseText = standardResponse.text || "";
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        response: responseText,
        text: responseText
      })
    };

  } catch (err: any) {
    console.error("Netlify chat function execution failed:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Internal Server Error",
        details: err?.message || String(err)
      })
    };
  }
};
