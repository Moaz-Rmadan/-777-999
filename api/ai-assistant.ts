import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini AI client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

    res.status(200).json({ reply: response.text || "عذراً، لم أستطع توليد رد في الوقت الحالي." });
  } catch (error: any) {
    console.error("AI Assistant Error:", error);
    res.status(500).json({ error: error.message || "حدث خطأ أثناء الاتصال بالذكاء الاصطناعي." });
  }
}
