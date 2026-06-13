import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();

// Custom lightweight CORS middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Dual module pdf-parse loader helper to avoid CJS compilation 'import.meta' crashes
async function parsePdf(buffer: Buffer): Promise<any> {
  if (typeof require !== "undefined") {
    const pdfParser = require("pdf-parse");
    return pdfParser(buffer);
  } else {
    const { createRequire } = await import("module");
    const requireFn = createRequire(import.meta.url);
    const pdfParser = requireFn("pdf-parse");
    return pdfParser(buffer);
  }
}

// Body parser middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Server-Side Gemini initialization
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
}) : null;

// API routes definition FIRST

// Health Check with credential verification
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    geminiKeyPresent: !!apiKey 
  });
});

// Endpoint 1: Active Recall Questions
app.post("/api/recall/questions", async (req, res) => {
  try {
    const { notes } = req.body;
    if (!notes) {
      return res.status(400).json({ error: "Missing study notes context" });
    }

    if (!ai) {
      return res.status(503).json({ error: "Gemini API client not initialized" });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: `Generate a list of exactly 10 high-quality, diverse active recall questions and matching detailed answers based directly on these study notes:\n\n${notes}`,
      config: {
        systemInstruction: "You are an expert academic tutor. Analyze the student's study notes and generate exactly 10 highly effective, core active recall questions that test deep understanding of key conceptual content, with detailed answers summarizing the core knowledge. If the provided context is brief or short, logically extrapolate and invent relevant high-yield medical/science/topic-related reinforcement helper questions to reach exactly 10 test items. Avoid shallow boolean questions.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          description: "List of active recall study questions and Answers.",
          items: {
            type: Type.OBJECT,
            properties: {
              question: {
                type: Type.STRING,
                description: "The conceptual recall question text."
              },
              answer: {
                type: Type.STRING,
                description: "The corresponding detail, answer, or memory explanation."
              }
            },
            required: ["question", "answer"]
          }
        }
      }
    });

    const parsedData = JSON.parse(response.text?.trim() || "[]");
    res.json(parsedData);
  } catch (err: any) {
    console.error("Recall questions API failure:", err);
    res.status(500).json({ error: "Failed to generate questions", details: err?.message });
  }
});

// Endpoint 2: Flashcards
app.post("/api/recall/flashcards", async (req, res) => {
  try {
    const { notes } = req.body;
    if (!notes) {
      return res.status(400).json({ error: "Missing study notes context" });
    }

    if (!ai) {
      return res.status(503).json({ error: "Gemini API client not initialized" });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: `From the following study lines, extract and design exactly 10 high-quality, comprehensive logical flashcards with a prompt/question on the front and answer/definition on the back side:\n\n${notes}`,
      config: {
        systemInstruction: "You are a professional flashcard designer. Generate neat study deck flashcards with a concise, clear term, prompt, or query on the front side, and a comprehensive explanation or definition on the back side based on the user's text. You MUST generate exactly 10 cards. If the input text is small, expand with related academic sub-definitions or secondary concepts to reach exactly 10 dense cards.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          description: "List of custom flashcards.",
          items: {
            type: Type.OBJECT,
            properties: {
              front: {
                type: Type.STRING,
                description: "Short cue, question, or keyword displayed on the front side of the card."
              },
              back: {
                type: Type.STRING,
                description: "The complete definition, equation, or answer displayed on the back side."
              }
            },
            required: ["front", "back"]
          }
        }
      }
    });

    const parsedData = JSON.parse(response.text?.trim() || "[]");
    res.json(parsedData);
  } catch (err: any) {
    console.error("Flashcards API failure:", err);
    res.status(500).json({ error: "Failed to generate flashcards", details: err?.message });
  }
});

// Endpoint 3: Quiz Comprehension
app.post("/api/recall/quiz", async (req, res) => {
  try {
    const { notes } = req.body;
    if (!notes) {
      return res.status(400).json({ error: "Missing study notes context" });
    }

    if (!ai) {
      return res.status(503).json({ error: "Gemini API client not initialized" });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: `Synthesize a comprehensive, high-quality multiple-choice quiz with exactly 10 diverse questions based on the core content described here:\n\n${notes}`,
      config: {
        systemInstruction: "You are a teacher preparing an interactive academic test. Generate a title for the quiz, and design exactly 10 challenging, conceptual multiple-choice study questions representing the material. Each question must include exactly 4 options and provide the 0-based index targeting the single correct answer option. If the context is brief, expand on academic subthemes and related auxiliary knowledge to generate exactly 10 top-tier MCQ questions.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: "Engaging quiz title matching the topic."
            },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: {
                    type: Type.STRING,
                    description: "The multiple choice question text."
                  },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Exactly 4 unique, realistic choices/options."
                  },
                  correctAnswerIndex: {
                    type: Type.INTEGER,
                    description: "The 0-based index corresponding to the correct answer in options array (0, 1, 2, or 3)."
                  }
                },
                required: ["question", "options", "correctAnswerIndex"]
              }
            }
          },
          required: ["title", "questions"]
        }
      }
    });

    const parsedData = JSON.parse(response.text?.trim() || "{}");
    res.json(parsedData);
  } catch (err: any) {
    console.error("Quiz API failure:", err);
    res.status(500).json({ error: "Failed to generate quiz", details: err?.message });
  }
});

// Endpoint 4: Analyze study materials from file import (PDF, DOCX, TXT)
app.post("/api/import/analyze", async (req, res) => {
  try {
    const { base64, mimeType, fileName } = req.body;
    if (!base64) {
      return res.status(400).json({ error: "Missing file content base64 stream" });
    }

    if (!ai) {
      return res.status(503).json({ error: "Gemini API client not initialized" });
    }

    let extractedText = "";
    const nameLower = (fileName || "").toLowerCase();
    const mimeLower = (mimeType || "").toLowerCase();

    const buffer = Buffer.from(base64, "base64");

    if (mimeLower.includes("pdf") || nameLower.endsWith(".pdf")) {
      try {
        const pdfData = await parsePdf(buffer);
        extractedText = pdfData.text || "";
      } catch (pdfErr: any) {
        throw new Error(`PDF text extraction failed: ${pdfErr.message}`);
      }
    } else if (
      mimeLower.includes("word") || 
      mimeLower.includes("officedocument.wordprocessingml") || 
      nameLower.endsWith(".docx")
    ) {
      try {
        const mammothModule = await import("mammoth");
        const extractFn = mammothModule.extractRawText || (mammothModule.default && (mammothModule.default as any).extractRawText);
        const docxResult = await extractFn({ buffer });
        extractedText = docxResult.value || "";
      } catch (docxErr: any) {
        throw new Error(`DOCX text extraction failed: ${docxErr.message}`);
      }
    } else {
      // Treat as plain text
      extractedText = buffer.toString("utf8");
    }

    if (!extractedText.trim()) {
      return res.status(400).json({ error: "Could not extract any readable text from this file." });
    }

    // Pass first 180k characters of text to keep within reasonable performance limits and avoid latency spikes
    const textSegmentToAnalyze = extractedText.substring(0, 180000);

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: `You are an expert academic text analyzer. Analyze the following textbook/notes segment and break it down into an intuitive study outline consisting of Chapters, and under each Chapter, several logical Subtopics/Sections.

Analyze the material fully to identify key concepts, definitions, formulas, processes, important facts, dates, and spelling/vocabulary terms.
Calculate a visual density complexity score (from 1 to 10) based on:
1. Number of concepts and topics
2. Amount of dense academic information
3. Presence of chemical/biological/mathematical formulas & procedural processes
4. Reading difficulty grade level (e.g. Beginner, Intermediate, Advanced, Specialized Collegiate)

Assign a cohesive proposed "title" for the entire study material.
For each logical subtopic/section, provide its title and a descriptive content block (200-500 words) summarizing the core factual details so it can be used for deep study.

Extracted Document Context Selection:
---
${textSegmentToAnalyze}
---`,
      config: {
        systemInstruction: "You are a professional syllabus parsing and academic curriculum analytics agent. Organize raw text into a hierarchical tree of Chapters and Subtopics. Perform detailed content analysis to count and list key concepts, formulas, processes, facts, dates, definitions, and vocabulary. Return the structured results matching the output JSON schema.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: "Proposed overall document study title"
            },
            complexityScore: {
              type: Type.NUMBER,
              description: "Visual complexity score from 1 (very simple) to 10 (extremely dense/advanced)"
            },
            readingDifficulty: {
              type: Type.STRING,
              description: "Primary academic level, e.g., Beginner, Intermediate, Advanced, or Specialized Collegiate"
            },
            detectedConceptsCount: {
              type: Type.INTEGER,
              description: "Number of core concepts detected"
            },
            detectedFormulasCount: {
              type: Type.INTEGER,
              description: "Number of mathematical/scientific formulas or equations/rules detected"
            },
            detectedProcessesCount: {
              type: Type.INTEGER,
              description: "Number of steps, procedural sequences, cycles, or pipelines detected"
            },
            detectedDefinitionsCount: {
              type: Type.INTEGER,
              description: "Number of academic definitions detected"
            },
            detectedFactsCount: {
              type: Type.INTEGER,
              description: "Number of important factual details or unique facts detected"
            },
            detectedDatesCount: {
              type: Type.INTEGER,
              description: "Number of notable calendar dates or chronological markers detected"
            },
            detectedVocabularyCount: {
              type: Type.INTEGER,
              description: "Number of specialized glossary terms or vocabulary words detected"
            },
            keyConcepts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "A short list representing the 3-6 primary key concepts detected"
            },
            formulas: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "A short list (3-6 items) of specific equations or chemical/physical laws detected"
            },
            processes: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "A short list (3-6 items) of procedural sequences, lifecycles, or processes detected"
            },
            definitions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "A short list (3-6 items) of primary definitions detected"
            },
            chapters: {
              type: Type.ARRAY,
              description: "Chapters detected in the document text flow",
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, description: "A simple unique chapter ID, e.g. ch_1" },
                  title: { type: Type.STRING, description: "Name of the Chapter" },
                  topics: {
                    type: Type.ARRAY,
                    description: "Subtopics, headings, or sections inside this chapter",
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING, description: "A unique subtopic ID, e.g. sub_1_1" },
                        title: { type: Type.STRING, description: "Subtopic, heading, or section name" },
                        content: { type: Type.STRING, description: "Detailed summary belonging to this section." }
                      },
                      required: ["id", "title", "content"]
                    }
                  }
                },
                required: ["id", "title", "topics"]
              }
            }
          },
          required: [
            "title",
            "complexityScore",
            "readingDifficulty",
            "detectedConceptsCount",
            "detectedFormulasCount",
            "detectedProcessesCount",
            "detectedDefinitionsCount",
            "detectedFactsCount",
            "detectedDatesCount",
            "detectedVocabularyCount",
            "keyConcepts",
            "formulas",
            "processes",
            "definitions",
            "chapters"
          ]
        }
      }
    });

    const parsedData = JSON.parse(response.text?.trim() || "{}");
    res.json({
      success: true,
      fileName,
      title: parsedData.title || fileName || "Imported Material",
      chapters: parsedData.chapters || [],
      extractedTextLength: extractedText.length,
      complexityScore: parsedData.complexityScore || 5,
      readingDifficulty: parsedData.readingDifficulty || "Intermediate",
      detectedConceptsCount: parsedData.detectedConceptsCount || 0,
      detectedFormulasCount: parsedData.detectedFormulasCount || 0,
      detectedProcessesCount: parsedData.detectedProcessesCount || 0,
      detectedDefinitionsCount: parsedData.detectedDefinitionsCount || 0,
      detectedFactsCount: parsedData.detectedFactsCount || 0,
      detectedDatesCount: parsedData.detectedDatesCount || 0,
      detectedVocabularyCount: parsedData.detectedVocabularyCount || 0,
      keyConcepts: parsedData.keyConcepts || [],
      formulas: parsedData.formulas || [],
      processes: parsedData.processes || [],
      definitions: parsedData.definitions || []
    });
  } catch (err: any) {
    console.error("Import Analyze failure:", err);
    res.status(500).json({ error: "Failed to analyze study material", details: err?.message });
  }
});

// Endpoint 5: Generate custom study resources for import modules
app.post("/api/import/generate-study", async (req, res) => {
  try {
    const { content, type, limit, studyMode } = req.body;
    if (!content) {
      return res.status(400).json({ error: "No study content selected or provided" });
    }
    if (!type) {
      return res.status(400).json({ error: "Missing query material generation type parameter" });
    }

    if (!ai) {
      return res.status(503).json({ error: "Gemini API client not initialized" });
    }

    let responseSchema: any;
    let systemInstruction = "";
    let promptText = "";

    const finalCount = limit ? parseInt(limit, 10) : 10;
    const modeLabel = studyMode ? `[Study Mode: ${studyMode}]` : "";

    if (type === "flashcard") {
      responseSchema = {
        type: Type.ARRAY,
        description: "List of generated flashcards.",
        items: {
          type: Type.OBJECT,
          properties: {
            front: { type: Type.STRING, description: "Front side term, cue, formula, or question" },
            back: { type: Type.STRING, description: "Back side answer, explanation, or definition" }
          },
          required: ["front", "back"]
        }
      };
      systemInstruction = `You are a professional flashcard designer. ${modeLabel}
You MUST generate EXACTLY ${finalCount} high-quality, effective study flashcards based on the provided material.
Quality Control Mandate:
1. Avoid duplicate questions or closely related cards. Every card must target a distinct concept or fact.
2. Prioritize key academic concepts, formulas, processes, and vocabulary terms.
3. Ensure flashcards represent diverse aspects of the text. Maintain clear, dense, and engaging definitions on the back.`;
      promptText = `Create exactly ${finalCount} unique study flashcards from this text, covering the key concepts without any duplicate cards:\n\n${content}`;
    } else if (type === "mcq") {
      responseSchema = {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Cohesive quiz title" },
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Exactly 4 options"
                },
                correctAnswerIndex: { type: Type.INTEGER, description: "0-based index of correct option" }
              },
              required: ["question", "options", "correctAnswerIndex"]
            }
          }
        },
        required: ["title", "questions"]
      };
      systemInstruction = `You are an educator. ${modeLabel}
Design an interactive multiple-choice quiz with EXACTLY ${finalCount} unique questions.
Quality Control Mandate:
1. Ensure all multiple-choice questions represent distinct factual or conceptual queries (no overlaps or near-duplicate questions).
2. Prioritize key concepts, crucial processes, formulas, and vocabulary details.
3. Each question must include exactly 4 plausible choices/options with a single logical correct answer index (0 to 3).`;
      promptText = `Generate a MCQ quiz with exactly ${finalCount} unique questions based on this study text:\n\n${content}`;
    } else if (type === "recall") {
      responseSchema = {
        type: Type.ARRAY,
        description: "List of active recall QA prompts.",
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING, description: "Deep conceptual recall question" },
            answer: { type: Type.STRING, description: "Detailed model answer / grading point" }
          },
          required: ["question", "answer"]
        }
      };
      systemInstruction = `You are an academic coach. ${modeLabel}
Build a set of EXACTLY ${finalCount} highly effective active recall questions and comprehensive answers testing deep conceptual understanding.
Quality Control Mandate:
1. Do not duplicate questions. Ensure each recall question focuses on a distinct core concept, formula, date, or process.
2. Structure the questions to encourage active retrieval of key structural information rather than simple yes/no answers.
3. Provide high-fidelity, comprehensive answers containing exact grading points or definitions.`;
      promptText = `Generate exactly ${finalCount} unique, substantive active recall questions based on this study text:\n\n${content}`;
    } else if (type === "summary") {
      responseSchema = {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING, description: "Detailed markdown summary" }
        },
        required: ["summary"]
      };
      systemInstruction = `You are a concise textbook editor. ${modeLabel}
Read the requested segment and write a beautiful, highly detailed academic summary in structured Markdown, including key definitions, bullet lists, processes, formulas, and summary takeaways.`;
      promptText = `Write an academic Markdown study summary of this text:\n\n${content}`;
    } else if (type === "notes") {
      responseSchema = {
        type: Type.OBJECT,
        properties: {
          notes: { type: Type.STRING, description: "Comprehensive structural markdown study notes" }
        },
        required: ["notes"]
      };
      systemInstruction = `You are a top-tier note-taking analyst. ${modeLabel}
Convert raw textbook info into highly polished, structured student study notes in Markdown using bold markers, highlights, list indentations, formulas, processes, and structural subdivisions.`;
      promptText = `Construct high-grade study notes in Markdown for the following material:\n\n${content}`;
    } else {
      return res.status(400).json({ error: "Invalid study material generation type" });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: promptText,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema
      }
    });

    const parsedData = JSON.parse(response.text?.trim() || "{}");
    res.json({
      success: true,
      data: parsedData
    });
  } catch (err: any) {
    console.error("Generate Study materials failure:", err);
    res.status(500).json({ error: "Failed to generate material via Gemini", details: err?.message });
  }
});

// Endpoint 6: AI Tutor Chat API
app.post("/api/tutor/chat", async (req, res) => {
  try {
    const { messages, mode, learningSupport, context } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Missing or invalid chat messages list" });
    }

    if (!ai) {
      return res.status(503).json({ error: "Gemini API client not initialized. Check your secrets settings." });
    }

    const contextSubject = context?.subject || "";
    const contextChapter = context?.chapter || "";
    const contextTopic = context?.topic || "";
    const contextNotes = context?.noteText || "";
    const additionalMaterial = context?.additionalMaterial || "";

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

Behavior / Speed Rules:
1. Answer directly and immediately. DO NOT waste output on welcoming introductions in every response (e.g. do not say "Hello, in this session, we will look at..."). Start answering the student's question to keep the chat lightning-fast.
2. Structure replies with clean, beautiful Markdown text (use headers like ###, standard bolding **, lists, and code blocks \`\`).
3. Keep accuracy and didactic quality very high. Always maintain an encouraging, smart, helpful tutor persona.
`;

    // Map conversation messages to Gemini's expected contents format
    // Filter out empty messages, remove leading model/assistant chats, and enforce strict user-model alternation
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

    // If contents array is empty, bootstrap with a friendly trigger
    if (contents.length === 0) {
      contents.push({
        role: "user",
        parts: [{ text: `Hello! I am ready to study. My current study mode is "${mode}" of "${contextTopic || 'general knowledge'}" with learning style "${learningSupport}". Please introduce yourself and start the tutorial session!` }]
      });
    }

    const lastUserMsgText = processedMessages[processedMessages.length - 1]?.parts?.[0]?.text || "";
    const needsSearch = /latest|news|today|yesterday|current|search the web|search google|live info/i.test(lastUserMsgText);

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    let responseStream;
    let isSearchActive = false;

    if (needsSearch) {
      try {
        isSearchActive = true;
        console.log("User query indicates need for current events search grounding. Initializing search stream...");
        responseStream = await ai.models.generateContentStream({
          model: "gemini-3.1-flash-lite",
          contents,
          config: {
            systemInstruction,
            temperature: 0.7,
            tools: [{ googleSearch: {} }]
          }
        });
      } catch (searchInitErr: any) {
        console.warn("Google Search grounding failed during initialization, using standard stream instead:", searchInitErr.message || searchInitErr);
        isSearchActive = false;
      }
    }

    if (!responseStream) {
      responseStream = await ai.models.generateContentStream({
        model: "gemini-3.1-flash-lite",
        contents,
        config: {
          systemInstruction,
          temperature: 0.7
        }
      });
    }

    let hasWritten = false;


    try {
      for await (const chunk of responseStream) {
        const textVal = chunk.text;
        if (textVal) {
          res.write(textVal);
          hasWritten = true;
        }
      }
    } catch (streamRunErr: any) {
      console.warn("Error encountered during active grounded stream chunk iteration:", streamRunErr);
      // If search stream fails mid-way or during the first chunk, and we haven't successfully written data yet,
      // fallback to standard text stream generation so the user doesn't get a silent blank stream or error
      if (!hasWritten) {
        try {
          const fallbackStream = await ai.models.generateContentStream({
            model: "gemini-3.1-flash-lite",
            contents,
            config: {
              systemInstruction,
              temperature: 0.7
            }
          });
          for await (const chunk of fallbackStream) {
            const textVal = chunk.text;
            if (textVal) {
              res.write(textVal);
            }
          }
        } catch (fallbackErr: any) {
          console.error("Fallback stream failed too:", fallbackErr);
        }
      }
    }
    res.end();
  } catch (err: any) {
    console.error("AI Tutor chat failure:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "AI Tutor service failed", details: err?.message });
    } else {
      res.end();
    }
  }
});

// Vite Middleware & SPA serving configuration

async function initializeViteAndListen() {
  if (process.env.NODE_ENV !== "production") {
    // Development Mode Vite Middleware
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development server middleware mounted successfully.");
  } else {
    // Production Mode serving from dist folder
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express custom server online at http://0.0.0.0:${PORT}`);
  });
}

initializeViteAndListen().catch(err => {
  console.error("Failed to initialize server middleware:", err);
});
