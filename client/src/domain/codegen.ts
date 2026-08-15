/**
 * 精密工作台风格契约：代码生成器只使用请求正文与 Provider 元数据；任何凭据始终替换为明确占位符。
 */
import type { CodeGenerationRequest, Message } from "./types";

export interface CodeGenerator { generate(input: CodeGenerationRequest): string; }

const bodyFor = (messages: Message[], model: string, temperature?: number, maxTokens?: number) => ({ model, messages: messages.map(({ role, content }) => ({ role, content })), ...(temperature === undefined ? {} : { temperature }), ...(maxTokens === undefined ? {} : { max_tokens: maxTokens }) });
const endpoint = (baseUrl: string) => `${baseUrl.replace(/\/+$/, "")}/chat/completions`;

export class OpenAICompatibleCodeGenerator implements CodeGenerator {
  generate(input: CodeGenerationRequest): string {
    const body = JSON.stringify(bodyFor(input.request.messages, input.request.model, input.request.temperature, input.request.maxTokens), null, 2);
    const url = endpoint(input.provider.baseUrl);
    if (input.language === "curl") return `curl "${url}" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '${body.replace(/'/g, "'\\''")}'`;
    if (input.language === "python") return `from openai import OpenAI

client = OpenAI(api_key="YOUR_API_KEY", base_url="${input.provider.baseUrl.replace(/\/+$/, "")}")
response = client.chat.completions.create(
    model=${JSON.stringify(input.request.model)},
    messages=${JSON.stringify(input.request.messages.map(({ role, content }) => ({ role, content })), null, 4)},
    temperature=${input.request.temperature ?? 0.7},
    max_tokens=${input.request.maxTokens ?? 1024},
)
print(response.choices[0].message.content)`;
    if (input.language === "node") return `import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.PROVIDER_API_KEY || "YOUR_API_KEY",
  baseURL: "${input.provider.baseUrl.replace(/\/+$/, "")}",
});

const response = await client.chat.completions.create(${body});
console.log(response.choices[0]?.message?.content);`;
    return `const response = await fetch("${url}", {
  method: "POST",
  headers: {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json",
  },
  body: JSON.stringify(${body}),
});

const data = await response.json();
console.log(data.choices?.[0]?.message?.content);`;
  }
}

export const codeGenerator = new OpenAICompatibleCodeGenerator();
