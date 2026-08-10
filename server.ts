import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini AI client if key is available
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// AI Assistant endpoint for supermarket management & accounting insights
app.post("/api/ai-assistant", async (req, res) => {
  try {
    const { prompt, contextData } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: "الطلب مطلوب (prompt is required)" });
    }

    const systemInstruction = `أنت مساعد ذكي ومحاسب محترف لإدارة السوبر ماركت (SuperMarket Pro AI Assistant). 
مهمتك تحليل البيانات المالية، المبيعات، المخزون، وتقديم استشارات محاسبية دقيقة، اقتراحات لإعادة الطلب، تحليل الأصناف الراكدة، وحساب الأرباح والخسائر باللغة العربية بأسلوب احترافي ومباشر.
بيانات النظام الحالية للمتجر: ${JSON.stringify(contextData || {})}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({ reply: response.text || "عذراً، لم أستطع توليد رد في الوقت الحالي." });
  } catch (error: any) {
    console.error("AI Assistant Error:", error);
    res.status(500).json({ error: error.message || "حدث خطأ أثناء الاتصال بالذكاء الاصطناعي." });
  }
});

async function startServer() {
  // Vite middleware setup for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
