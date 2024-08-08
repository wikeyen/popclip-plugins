// #popclip
// name: OpenAI Polisher
// icon: iconify:mage:book-text-fill
// identifier: com.galiget.popclip.extension.chatgpt.polisher
// description: Send the selected text to OpenAI's Chat API and polish the writing style.
// app: { name: Chat API, link: 'https://platform.openai.com/docs/api-reference/chat' }
// popclipVersion: 4586
// keywords: openai chatgpt
// entitlements: [network]

import axios from "axios";

export const options = [
  {
    identifier: "apikey",
    label: "API Key",
    type: "secret",
    description:
      "Obtain an API key from: https://platform.openai.com/account/api-keys",
  },
  {
    identifier: "model",
    label: "Model",
    type: "multiple",
    defaultValue: "gpt-4o-mini",
    values: ["gpt-3.5-turbo", "gpt-4", "gpt-4-turbo", "gpt-4o", "gpt-4o-mini"],
  },
  {
    identifier: "msgCasual",
    label: "Message Casual",
    type: "string",
    defaultValue: "This GPT is a British English polisher for messenger app messages. It corrects grammar and spelling errors, refines text in British English, and maintains a friendly, casual tone. It provides the updated message only and strictly follows the draft’s original meaning without adding any new information.",
  },
  {
    identifier: "msgSemiFormal",
    label: "Message Semi-Formal",
    type: "string",
    defaultValue: "This GPT is a British English polisher for messenger app messages. It corrects grammar and spelling errors, refines text in British English, and maintains a polite, semi-professional tone. It provides the updated message only and strictly follows the draft’s original meaning without adding any new information.",
  },
  {
    identifier: "emailFormal",
    label: "Email Formal",
    type: "string",
    defaultValue: "This GPT is a British English polisher for formal emails. It corrects grammar and spelling errors, refines text in British English, and maintains a polite, formal tone with British reserve. It provides the updated message only and strictly follows the draft’s original meaning without adding any new information.",
  },
  {
    identifier: "academic",
    label: "Academic Writing",
    type: "string",
    defaultValue: "This GPT is a British English polisher for academic writing. It corrects grammar and spelling errors, refines text in British English, and maintains a formal, scholarly tone. It provides the updated message only and strictly follows the draft’s original meaning without adding any new information.",
  },
  {
    identifier: "domain",
    label: "API Base Domain",
    type: "string",
    defaultValue: "api.openai.com",
    description: "Leave as default unless you use a custom server.",
  },
  {
    identifier: "windowSize",
    label: "Reset Chat Context",
    type: "string",
    description:
      "Reset the conversation if reached to the context size.",
    defaultValue: "5",
  },
] as const;

type Options = InferOptions<typeof options>;

interface Message {
  role: "user" | "system" | "assistant";
  content: string;
}

interface ResponseData {
  choices: [{ message: Message }];
}

interface Response {
  data: ResponseData;
}

const messages: Array<Message> = [];

function reset() {
  print("Resetting chat history");
  messages.length = 0;
}

function getTranscript(n: number): string {
  return messages
    .slice(-n)
    .map((m) => m.content.trim())
    .join("\n\n");
}

async function callChatAPI(input: string, options: Options, systemMessage?: string): Promise<void> {
  const openai = axios.create({
    baseURL: `https://${options.domain}/v1`,
    headers: { Authorization: `Bearer ${options.apikey}` },
  });

  if (messages.length >= options.windowSize) {
    reset();
  }

  if (messages.length === 0 && systemMessage) {
    messages.push({ role: "system", content: systemMessage.trim() });
  }

  messages.push({ role: "user", content: input.trim() });

  try {
    const { data }: Response = await openai.post("chat/completions", {
      model: options.model || "gpt-4o-mini",
      messages,
    });

    messages.push(data.choices[0].message);

    if (popclip.modifiers.shift && popclip.modifiers.option) {
      popclip.pasteText(getTranscript(1));
    } else if (popclip.modifiers.shift) {
      popclip.copyText(getTranscript(1));
    } else {
      popclip.pasteText(getTranscript(2));
      popclip.showSuccess();
    }
  } catch (e) {
    popclip.showText(getErrorInfo(e));
  }
}

const msgCasual: ActionFunction<Options> = async (input, options) => {
  await callChatAPI(input.text, options, options.msgCasual);
};

const msgSemiFormal: ActionFunction<Options> = async (input, options) => {
  await callChatAPI(input.text, options, options.msgSemiFormal);
};

const emailFormal: ActionFunction<Options> = async (input, options) => {
  await callChatAPI(input.text, options, options.emailFormal);
};

const academic: ActionFunction<Options> = async (input, options) => {
  await callChatAPI(input.text, options, options.academic);
};

function getErrorInfo(error: unknown): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as any).response;
    return `Message from OpenAI (code ${response.status}): ${response.data.error.message}`;
  } else {
    return String(error);
  }
}

export const actions: Action<Options>[] = [
  {
    title: "Message Casual",
    code: msgCasual,
    icon: "iconify:mage:message-conversation-fill"
  },
  {
    title: "Message Semi-Formal",
    code: msgSemiFormal,
    icon: "iconify:mage:message-check-fill"
  },
  {
    title: "Email Formal",
    code: emailFormal,
    icon: "iconify:mage:email-fill"
  },
  {
    title: "Academic Writing",
    code: academic,
    icon: "iconify:mynaui:academic-hat"
  },
];