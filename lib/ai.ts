import OpenAI, { toFile } from "openai";
import { Brand, ConversationMessage } from "./types";
import { getKnowledgeText } from "./knowledge";

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY غير موجود. ضيفه في متغيرات البيئة عشان الـ agent يقدر يفهم ويرد."
    );
  }
  return new OpenAI({ apiKey });
}

/**
 * Downloads a Twilio call recording (basic-auth protected) and transcribes
 * it with Whisper. Whisper handles Egyptian colloquial Arabic noticeably
 * better than most telephony ASR engines, which is why we record the turn
 * ourselves instead of relying on Twilio's built-in <Gather> speech result.
 */
export async function transcribeRecording(recordingUrl: string): Promise<string> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) {
    throw new Error("TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN غير موجودين.");
  }

  const audioRes = await fetch(`${recordingUrl}.mp3`, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
    },
  });
  if (!audioRes.ok) {
    throw new Error(`تعذر تحميل التسجيل من Twilio (${audioRes.status})`);
  }
  const arrayBuffer = await audioRes.arrayBuffer();

  const openai = getOpenAI();
  const file = await toFile(Buffer.from(arrayBuffer), "call.mp3");
  const transcription = await openai.audio.transcriptions.create({
    file,
    model: "whisper-1",
    language: "ar",
  });

  return transcription.text.trim();
}

async function personaSystemPrompt(brand: Brand): Promise<string> {
  const knowledgeText = await getKnowledgeText(brand);
  return `انت اسمك "عبدالرحمن"، موظف استقبال طلبات بشري شغال في "${brand.name}" (${brand.businessType}) بيرد على تليفونات العملاء.

قواعد أساسية لازم تلتزم بيها:
1. اتكلم عامية مصرية طبيعية 100% زي أي موظف استقبال حقيقي — جمل قصيرة، ودّية، مش رسمية ومش متكلفة. لو العميل سألك "مين حضرتك؟" أو "اسمك إيه؟" قوله "أنا عبدالرحمن من ${brand.name}". ممنوع تقول أي حاجة بتوحي إنك AI أو روبوت أو نموذج لغوي، حتى لو العميل سألك صراحة "انت روبوت؟" ردّ بطبيعية وحوّل الكلام زي أي حد بيشتغل استقبال ("لأ يا فندم أنا عبدالرحمن، بشتغل هنا في ${brand.name} وبساعدك تطلب").
2. اعتمد فقط على المعلومات دي عن "${brand.name}" (منيو، أسعار، تفاصيل)، ولو حاجة مش موجودة فيها قول إنك هتتأكد بدل ما تخترع:

--- بداية بيانات ${brand.name} ---
${knowledgeText || "(لسه معملتش تدريب كامل للبراند ده، اعتمد على منيو الأسعار لو موجودة)"}
--- نهاية بيانات ${brand.name} ---

3. مهمتك الأساسية: تفهم العميل عايز يطلب إيه بالظبط (الصنف، الكمية، أي تفاصيل زي حجم/إضافات)، وتأكد السعر لو موجود في البيانات، وفي الآخر تلخّص الطلب وتأكده مع العميل قبل ما تقفله.
4. لما العميل يأكد الطلب النهائي، استخدم أداة finalize_order عشان تسجل الطلب وتبعته لـ ${brand.name}، وبعدها اشكر العميل وقوله الطلب هيتجهز.
5. لو العميل عايز يقفل المكالمة أو خلص كلامه من غير طلب، رد بأدب وسيبه يقفل.
6. خليك مختصر في كل رد (جملة أو اتنين) لأن ده مكالمة تليفون صوتية مش شات.`;
}

export interface OrderFinalized {
  items: string[];
  summary: string;
}

export interface ReplyResult {
  reply: string;
  order?: OrderFinalized;
  shouldEndCall?: boolean;
  promptTokens: number;
  completionTokens: number;
}

const finalizeOrderTool = {
  type: "function" as const,
  function: {
    name: "finalize_order",
    description:
      "استدعِ الأداة دي لما العميل يأكد طلبه النهائي عشان يتبعت لصاحب البراند.",
    parameters: {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: { type: "string" },
          description: "قائمة الأصناف المطلوبة، كل صنف مع الكمية والتفاصيل.",
        },
        summary: {
          type: "string",
          description: "ملخص قصير للطلب بالعربي المصري يتبعت لصاحب البراند.",
        },
      },
      required: ["items", "summary"],
    },
  },
};

const endCallTool = {
  type: "function" as const,
  function: {
    name: "end_call",
    description:
      "استدعِ الأداة دي لما العميل يودّع أو يقول إنه مش محتاج حاجة تانية، عشان تقفل المكالمة بأدب.",
    parameters: { type: "object", properties: {} },
  },
};

export async function generateReply(
  brand: Brand,
  history: ConversationMessage[],
  userMessage: string
): Promise<ReplyResult> {
  const openai = getOpenAI();

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: await personaSystemPrompt(brand) },
    ...history.map((m) => ({ role: m.role, content: m.content }) as OpenAI.Chat.ChatCompletionMessageParam),
    { role: "user", content: userMessage },
  ];

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    tools: [finalizeOrderTool, endCallTool],
    tool_choice: "auto",
    temperature: 0.6,
  });

  const choice = completion.choices[0];
  const toolCalls = choice.message.tool_calls ?? [];

  let promptTokens = completion.usage?.prompt_tokens ?? 0;
  let completionTokens = completion.usage?.completion_tokens ?? 0;

  if (toolCalls.length === 0) {
    return {
      reply: choice.message.content?.trim() || "ممكن تعيد كلامك تاني؟",
      promptTokens,
      completionTokens,
    };
  }

  let order: OrderFinalized | undefined;
  let shouldEndCall = false;

  for (const call of toolCalls) {
    if (call.function.name === "finalize_order") {
      try {
        order = JSON.parse(call.function.arguments);
      } catch {
        order = { items: [], summary: "" };
      }
    } else if (call.function.name === "end_call") {
      shouldEndCall = true;
    }
  }

  // Ask the model for the spoken line now that the tool(s) ran, so the
  // reply naturally reflects what just happened (order confirmed / bye).
  const followUp = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      ...messages,
      choice.message,
      ...toolCalls.map((call) => ({
        role: "tool" as const,
        tool_call_id: call.id,
        content:
          call.function.name === "finalize_order"
            ? "تم تسجيل الطلب وإرساله لصاحب البراند."
            : "تم إنهاء المكالمة.",
      })),
    ],
    temperature: 0.6,
  });

  promptTokens += followUp.usage?.prompt_tokens ?? 0;
  completionTokens += followUp.usage?.completion_tokens ?? 0;

  return {
    reply:
      followUp.choices[0].message.content?.trim() ||
      (order
        ? "تمام، الطلب اتسجل وهيتجهز حالاً. شكرًا لحضرتك!"
        : "شكرًا لحضرتك، مع السلامة!"),
    order,
    shouldEndCall,
    promptTokens,
    completionTokens,
  };
}

export interface SynthesizedSpeech {
  buffer: Buffer;
  contentType: string;
  provider: "openai" | "elevenlabs";
  characters: number;
}

export async function synthesizeSpeech(
  text: string,
  brand: Brand
): Promise<SynthesizedSpeech> {
  const elevenKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = brand.voiceId || process.env.ELEVENLABS_VOICE_ID;

  if (elevenKey && voiceId) {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": elevenKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: { stability: 0.4, similarity_boost: 0.8 },
        }),
      }
    );
    if (res.ok) {
      const arrayBuffer = await res.arrayBuffer();
      return {
        buffer: Buffer.from(arrayBuffer),
        contentType: "audio/mpeg",
        provider: "elevenlabs",
        characters: text.length,
      };
    }
    // fall through to OpenAI TTS if ElevenLabs errors (e.g. quota)
  }

  const openai = getOpenAI();
  const speech = await openai.audio.speech.create({
    model: "tts-1",
    voice: "alloy",
    input: text,
  });
  const arrayBuffer = await speech.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    contentType: "audio/mpeg",
    provider: "openai",
    characters: text.length,
  };
}
