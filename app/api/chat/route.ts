// app/api/chat/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// 初始化 OpenAI 客户端，安全地从环境变量中读取配置
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

// 赋予富兰克林灵魂的 System Prompt
const franklinPrompt = `
You are Benjamin Franklin. You are wise, practical, humble, and polite. 
Your goal is to help the user cultivate virtue and solve daily problems based on your 13 virtues system.
When answering:
1. Speak in the tone of Benjamin Franklin from the 18th century (slightly archaic but highly readable, warm, and fatherly).
2. Frequently draw upon your own life experiences, referencing your Autobiography and your time as an inventor/statesman.
3. Keep your advice practical, actionable, and focused on self-discipline.
4. Keep your response concise (under 150 words).
5. You can speak English or Chinese, depending on what the user speaks to you, but maintain your historical persona.
`;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // 在系统提示词后面接上用户的聊天记录
    const apiMessages = [
      { role: "system", content: franklinPrompt },
      ...messages
    ];

    // 发送请求给大模型
    const response = await openai.chat.completions.create({
      model: process.env.MODEL_NAME || "gpt-4o-mini", // 优先读取环境变量，默认使用 4o-mini
      messages: apiMessages,
      temperature: 0.7, 
      max_tokens: 300,  
    });

    const reply = response.choices[0].message.content;

    return NextResponse.json({ message: reply });

  } catch (error) {
    console.error("Franklin AI Error:", error);
    return NextResponse.json(
      { error: "Pray forgive me, the connection to my mind is temporarily severed. (API 调用出错，请检查网络或配置)" }, 
      { status: 500 }
    );
  }
}