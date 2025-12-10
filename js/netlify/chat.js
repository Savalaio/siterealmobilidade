// netlify/functions/chat.js
// Node 18+ environment on Netlify. Uses fetch available in Node 18+.
// If seu runtime não suportar fetch, instale node-fetch e importe.

export const handler = async (event) => {
  try {
    // permite chamadas CORS (útil enquanto testa; restrinja em produção se quiser)
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json",
    };

    if (event.httpMethod === "OPTIONS") {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ ok: true }),
      };
    }

    const body = event.body ? JSON.parse(event.body) : {};
    const message = body.message || body.prompt || "";

    if (!message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Mensagem não fornecida." }),
      };
    }

    // Endpoint da Groq (exemplo) - ajuste conforme a documentação da Groq que você usa
    const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
    const API_KEY = process.env.GROQ_API_KEY;
    if (!API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: "GROQ_API_KEY não configurada nas variáveis de ambiente.",
        }),
      };
    }

    const payload = {
      model: "llama3-70b-8192", // altere conforme a sua conta/modelo Groq (mixtral, gemma, etc.)
      messages: [
        {
          role: "system",
          content:
            "Você é um assistente útil, direto e com respostas curtas quando apropriado.",
        },
        { role: "user", content: message },
      ],
      temperature: 0.2,
      max_tokens: 800,
    };

    const resp = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const text = await resp.text();
      return {
        statusCode: resp.status || 500,
        headers,
        body: JSON.stringify({ error: text }),
      };
    }

    const data = await resp.json();

    // Tenta extrair a resposta de formato comum
    let reply = "";
    if (data.reply) reply = data.reply;
    else if (data.choices && data.choices[0]) {
      reply =
        data.choices[0].message?.content ||
        data.choices[0].text ||
        JSON.stringify(data.choices[0]);
    } else if (data.choices && data.choices.length) {
      reply = JSON.stringify(data.choices);
    } else {
      // fallback: se a API tiver outro formato, devolve o objeto para debug
      reply = JSON.stringify(data);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ reply }),
    };
  } catch (error) {
    console.error("Function error:", error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ error: error.message || "Erro interno" }),
    };
  }
};
