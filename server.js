import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";
import Fuse from "fuse.js";

dotenv.config();

const app = express();
const port = 5000;

app.use(express.json());

const predefinedQA = [
  { prompt: "What is your name?", response: "My name is Arun Singh." },
  {
    prompt: "What are your key skills?",
    response:
      "My key skills include ReactJS, NextJS, Spring Boot, NodeJS, MongoDB, and DevOps.",
  },
  // Additional questions and responses
];

// Helper function for fuzzy matching
const findClosestMatch = (userPrompt) => {
  if (!userPrompt || typeof userPrompt !== "string") {
    return null; // Return null if the prompt is invalid
  }

  const fuse = new Fuse(predefinedQA, {
    keys: ["prompt"],
    threshold: 0.3,
  });
  const result = fuse.search(userPrompt.trim()); // Trim to remove extra spaces
  return result.length ? result[0].item : null;
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/chat", async (req, res) => {
  const userPrompt = req.body.prompt;

  // Check for closest match in predefined QA
  const match = findClosestMatch(userPrompt);

  if (match) {
    res.send({ response: match.response });
  } else {
    // Fallback to OpenAI for open-ended queries
    try {
      const completion = await openai.completions.create({
        model: "gpt-3.5-turbo", // Use the newer model
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          {
            role: "user",
            content: `Answer based on this resume: ${JSON.stringify(
              predefinedQA
            )}\n\nQ: ${userPrompt}`,
          },
        ],
        max_tokens: 100,
      });
      res.send({ response: completion.choices[0].message.content.trim() });
    } catch (error) {
      console.error("OpenAI Error:", error);
      if (error.code === "insufficient_quota") {
        res.status(429).send({
          response:
            "You have exceeded your usage quota. Please check your billing details.",
        });
      } else {
        res.status(500).send({
          response: "I'm sorry, I couldn't process your request at the moment.",
        });
      }
    }
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

// import express from "express";
// import cors from "cors";
// import OpenAI from "openai";
// import fs from "fs";

// const app = express();
// app.use(cors());
// app.use(express.json());

// // Load environment variables
// import dotenv from "dotenv";
// dotenv.config();

// // OpenAI API configuration
// const openai = new OpenAI({
//   apiKey:
//     process.env.OPENAI_API_KEY,
// });
// // const openai = new OpenAIApi(configuration);

// // Load structured data from resume
// const resumeData = JSON.parse(fs.readFileSync("resume_data.json", "utf-8"));

// // Chat endpoint
// app.post("/chat", async (req, res) => {
//   const { message } = req.body;

//   try {
//     // Look for a match in resume data
//     const match = resumeData.find((item) =>
//       message.toLowerCase().includes(item.prompt.toLowerCase())
//     );

//     if (match) {
//       res.json({ reply: match.response });
//     } else {
//       // Fallback to OpenAI API if no match is found
//       const response = await openai.createCompletion({
//         model: "text-davinci-003",
//         prompt: `You are an intelligent assistant. Answer based on this resume: ${message}`,
//         max_tokens: 150,
//         temperature: 0.7,
//       });
//       res.json({ reply: response.data.choices[0].text.trim() });
//     }
//   } catch (error) {
//     console.error("Error:", error);
//     res.status(500).json({ reply: "Sorry, I couldn't process your request." });
//   }
// });

// // Start the server
// const PORT = 5000;
// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });
