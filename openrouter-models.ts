/**
 * OpenRouter 开源模型 Use Case 分类 (2026年3月)
 *
 * 数据来源:
 * - https://openrouter.ai/models
 * - https://openrouter.ai/rankings
 * - https://openrouter.ai/collections/programming
 * - https://openrouter.ai/collections/roleplay
 * - https://openrouter.ai/collections/free-models
 */

export interface OpenRouterModel {
  id: string;
  name: string;
  provider: string;
  parameters: string;
  contextLength: string;
  license: string;
  free: boolean;
}

export interface ModelCategory {
  category: string;
  description: string;
  models: OpenRouterModel[];
}

export const OPENROUTER_MODEL_CATEGORIES: ModelCategory[] = [
  // ─────────────────────────────────────────────
  // 1. 代码生成 / Coding
  // ─────────────────────────────────────────────
  {
    category: 'Code Generation',
    description: '代码生成、调试、重构、多文件 Agentic 编程',
    models: [
      {
        id: 'qwen/qwen3-coder:free',
        name: 'Qwen3 Coder 480B',
        provider: 'Alibaba (Qwen)',
        parameters: '480B MoE (35B active)',
        contextLength: '262K',
        license: 'Apache 2.0',
        free: true,
      },
      {
        id: 'mistral/devstral-2',
        name: 'Devstral 2 123B',
        provider: 'Mistral',
        parameters: '123B',
        contextLength: '128K',
        license: 'Modified MIT',
        free: false,
      },
      {
        id: 'deepseek/deepseek-v3.2-speciale',
        name: 'DeepSeek V3.2 Speciale',
        provider: 'DeepSeek',
        parameters: '685B MoE (37B active)',
        contextLength: '128K',
        license: 'MIT',
        free: false,
      },
      {
        id: 'qwen/qwen3-next-80b-a3b-instruct:free',
        name: 'Qwen3 Next 80B',
        provider: 'Alibaba (Qwen)',
        parameters: '80B MoE (3B active)',
        contextLength: '262K',
        license: 'Apache 2.0',
        free: true,
      },
      {
        id: 'openai/gpt-oss-120b',
        name: 'GPT-OSS 120B',
        provider: 'OpenAI',
        parameters: '117B MoE (5.1B active)',
        contextLength: '128K',
        license: 'Apache 2.0',
        free: true,
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 2. 推理 / Reasoning & Math
  // ─────────────────────────────────────────────
  {
    category: 'Reasoning & Math',
    description: '深度推理、数学、逻辑分析、Chain-of-Thought',
    models: [
      {
        id: 'deepseek/deepseek-r1:free',
        name: 'DeepSeek R1',
        provider: 'DeepSeek',
        parameters: '671B MoE (37B active)',
        contextLength: '128K',
        license: 'MIT',
        free: true,
      },
      {
        id: 'deepseek/deepseek-v3.2',
        name: 'DeepSeek V3.2',
        provider: 'DeepSeek',
        parameters: '685B MoE (37B active)',
        contextLength: '128K',
        license: 'MIT',
        free: false,
      },
      {
        id: 'qwen/qwen3-235b',
        name: 'Qwen3 235B',
        provider: 'Alibaba (Qwen)',
        parameters: '235B MoE',
        contextLength: '128K',
        license: 'Apache 2.0',
        free: false,
      },
      {
        id: 'stepfun/step-3.5-flash:free',
        name: 'Step 3.5 Flash',
        provider: 'StepFun',
        parameters: '196B MoE (11B active)',
        contextLength: '256K',
        license: 'Open',
        free: true,
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 3. 通用对话 / General Chat & Instruction
  // ─────────────────────────────────────────────
  {
    category: 'General Chat & Instruction',
    description: '通用问答、对话、知识检索、翻译、摘要',
    models: [
      {
        id: 'meta-llama/llama-3.3-70b-instruct:free',
        name: 'Llama 3.3 70B Instruct',
        provider: 'Meta',
        parameters: '70B',
        contextLength: '128K',
        license: 'Llama 3.3 Community',
        free: true,
      },
      {
        id: 'mistral/mistral-small-3.2-24b-instruct:free',
        name: 'Mistral Small 3.2 24B',
        provider: 'Mistral',
        parameters: '24B',
        contextLength: '128K',
        license: 'Apache 2.0',
        free: true,
      },
      {
        id: 'mistral/mistral-small-3.1-24b-instruct:free',
        name: 'Mistral Small 3.1 24B',
        provider: 'Mistral',
        parameters: '24B',
        contextLength: '128K',
        license: 'Apache 2.0',
        free: true,
      },
      {
        id: 'deepseek/deepseek-v3.1-terminus',
        name: 'DeepSeek V3.1 Terminus',
        provider: 'DeepSeek',
        parameters: '671B MoE (37B active)',
        contextLength: '128K',
        license: 'MIT',
        free: false,
      },
      {
        id: 'nvidia/nemotron-3-super-120b-a12b:free',
        name: 'Nemotron 3 Super 120B',
        provider: 'NVIDIA',
        parameters: '120B MoE (12B active)',
        contextLength: '262K',
        license: 'Open',
        free: true,
      },
      {
        id: 'nvidia/nemotron-3-nano-30b-a3b:free',
        name: 'Nemotron 3 Nano 30B',
        provider: 'NVIDIA',
        parameters: '30B MoE (3B active)',
        contextLength: '256K',
        license: 'Open',
        free: true,
      },
      {
        id: 'minimax/minimax-m2.5:free',
        name: 'MiniMax M2.5',
        provider: 'MiniMax',
        parameters: 'Unknown',
        contextLength: '128K',
        license: 'Open',
        free: true,
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 4. 创意写作 / Roleplay & Creative Writing
  // ─────────────────────────────────────────────
  {
    category: 'Roleplay & Creative Writing',
    description: '角色扮演、故事创作、沉浸式对话、剧本生成',
    models: [
      {
        id: 'arcee/trinity-large-preview:free',
        name: 'Arcee Trinity Large Preview',
        provider: 'Arcee',
        parameters: '400B MoE (13B active)',
        contextLength: '128K',
        license: 'Open',
        free: true,
      },
      {
        id: 'meta-llama/llama-4-maverick:free',
        name: 'Llama 4 Maverick',
        provider: 'Meta',
        parameters: 'Unknown',
        contextLength: '256K',
        license: 'Llama 4 Community',
        free: true,
      },
      {
        id: 'meta-llama/llama-4-scout:free',
        name: 'Llama 4 Scout',
        provider: 'Meta',
        parameters: 'Unknown',
        contextLength: '10M',
        license: 'Llama 4 Community',
        free: true,
      },
      {
        id: 'qwen/qwen3-30b-a3b:free',
        name: 'Qwen3 30B',
        provider: 'Alibaba (Qwen)',
        parameters: '30B MoE (3B active)',
        contextLength: '128K',
        license: 'Apache 2.0',
        free: true,
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 5. 多模态 / Vision & Multimodal
  // ─────────────────────────────────────────────
  {
    category: 'Vision & Multimodal',
    description: '图文理解、视频分析、文档识别、多模态推理',
    models: [
      {
        id: 'google/gemma-3-27b-it:free',
        name: 'Gemma 3 27B',
        provider: 'Google',
        parameters: '27B',
        contextLength: '128K',
        license: 'Gemma',
        free: true,
      },
      {
        id: 'google/gemma-3n-e4b-it:free',
        name: 'Gemma 3n E4B',
        provider: 'Google',
        parameters: '4B (effective)',
        contextLength: '128K',
        license: 'Gemma',
        free: true,
      },
      {
        id: 'google/gemma-3n-e2b-it:free',
        name: 'Gemma 3n E2B',
        provider: 'Google',
        parameters: '2B (effective)',
        contextLength: '128K',
        license: 'Gemma',
        free: true,
      },
      {
        id: 'nvidia/nemotron-nano-2-vl',
        name: 'Nemotron Nano 2 VL',
        provider: 'NVIDIA',
        parameters: '12B',
        contextLength: '128K',
        license: 'Open',
        free: false,
      },
      {
        id: 'mistral/mistral-small-3.1-24b-instruct:free',
        name: 'Mistral Small 3.1 24B (Vision)',
        provider: 'Mistral',
        parameters: '24B',
        contextLength: '128K',
        license: 'Apache 2.0',
        free: true,
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 6. 长上下文 / Long Context
  // ─────────────────────────────────────────────
  {
    category: 'Long Context',
    description: '超长文档处理、大规模代码库分析、长对话记忆',
    models: [
      {
        id: 'meta-llama/llama-4-scout:free',
        name: 'Llama 4 Scout (10M ctx)',
        provider: 'Meta',
        parameters: 'Unknown',
        contextLength: '10M',
        license: 'Llama 4 Community',
        free: true,
      },
      {
        id: 'qwen/qwen3-coder:free',
        name: 'Qwen3 Coder (262K ctx)',
        provider: 'Alibaba (Qwen)',
        parameters: '480B MoE',
        contextLength: '262K',
        license: 'Apache 2.0',
        free: true,
      },
      {
        id: 'nvidia/nemotron-3-super-120b-a12b:free',
        name: 'Nemotron 3 Super (262K ctx)',
        provider: 'NVIDIA',
        parameters: '120B MoE',
        contextLength: '262K',
        license: 'Open',
        free: true,
      },
      {
        id: 'stepfun/step-3.5-flash:free',
        name: 'Step 3.5 Flash (256K ctx)',
        provider: 'StepFun',
        parameters: '196B MoE',
        contextLength: '256K',
        license: 'Open',
        free: true,
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 7. 边缘 / 端侧部署 / Edge & On-Device
  // ─────────────────────────────────────────────
  {
    category: 'Edge & On-Device',
    description: '移动端推理、端侧部署、低延迟、轻量化模型',
    models: [
      {
        id: 'google/gemma-3n-e4b-it:free',
        name: 'Gemma 3n E4B (Mobile)',
        provider: 'Google',
        parameters: '4B (effective)',
        contextLength: '128K',
        license: 'Gemma',
        free: true,
      },
      {
        id: 'google/gemma-3n-e2b-it:free',
        name: 'Gemma 3n E2B (Mobile)',
        provider: 'Google',
        parameters: '2B (effective)',
        contextLength: '128K',
        license: 'Gemma',
        free: true,
      },
      {
        id: 'qwen/qwen3-0.6b',
        name: 'Qwen3 0.6B',
        provider: 'Alibaba (Qwen)',
        parameters: '0.6B',
        contextLength: '32K',
        license: 'Apache 2.0',
        free: false,
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 8. Agentic / 工具调用
  // ─────────────────────────────────────────────
  {
    category: 'Agentic & Tool Use',
    description: 'Function Calling、工具调用、多步工作流、RAG',
    models: [
      {
        id: 'deepseek/deepseek-v3.2',
        name: 'DeepSeek V3.2 (Agentic)',
        provider: 'DeepSeek',
        parameters: '685B MoE',
        contextLength: '128K',
        license: 'MIT',
        free: false,
      },
      {
        id: 'minimax/minimax-m2.5:free',
        name: 'MiniMax M2.5 (Agents)',
        provider: 'MiniMax',
        parameters: 'Unknown',
        contextLength: '128K',
        license: 'Open',
        free: true,
      },
      {
        id: 'mistral/mistral-small-3.2-24b-instruct:free',
        name: 'Mistral Small 3.2 (Function Calling)',
        provider: 'Mistral',
        parameters: '24B',
        contextLength: '128K',
        license: 'Apache 2.0',
        free: true,
      },
      {
        id: 'qwen/qwen3-next-80b-a3b-instruct:free',
        name: 'Qwen3 Next 80B (RAG & Tool Use)',
        provider: 'Alibaba (Qwen)',
        parameters: '80B MoE',
        contextLength: '262K',
        license: 'Apache 2.0',
        free: true,
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 9. 文本嵌入 / Embedding
  // ─────────────────────────────────────────────
  {
    category: 'Embedding',
    description: '语义搜索、文本相似度、聚类、分类、Reranking',
    models: [
      {
        id: 'qwen/qwen3-embedding-8b',
        name: 'Qwen3 Embedding 8B',
        provider: 'Alibaba (Qwen)',
        parameters: '8B',
        contextLength: '8K',
        license: 'Apache 2.0',
        free: false,
      },
      {
        id: 'qwen/qwen3-embedding-4b',
        name: 'Qwen3 Embedding 4B',
        provider: 'Alibaba (Qwen)',
        parameters: '4B',
        contextLength: '8K',
        license: 'Apache 2.0',
        free: false,
      },
      {
        id: 'qwen/qwen3-embedding-0.6b',
        name: 'Qwen3 Embedding 0.6B',
        provider: 'Alibaba (Qwen)',
        parameters: '0.6B',
        contextLength: '8K',
        license: 'Apache 2.0',
        free: false,
      },
      {
        id: 'google/embedding-gemma-300m',
        name: 'EmbeddingGemma 300M',
        provider: 'Google DeepMind',
        parameters: '300M',
        contextLength: '8K',
        license: 'Gemma',
        free: false,
      },
      {
        id: 'jina-ai/jina-embeddings-v4',
        name: 'Jina Embeddings v4',
        provider: 'Jina AI',
        parameters: '3B',
        contextLength: '8K',
        license: 'Apache 2.0',
        free: false,
      },
      {
        id: 'nomic-ai/nomic-embed-text-v2',
        name: 'Nomic Embed Text V2',
        provider: 'Nomic AI',
        parameters: 'MoE',
        contextLength: '8K',
        license: 'Apache 2.0',
        free: false,
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 10. 图像生成 / Image Generation
  // ─────────────────────────────────────────────
  {
    category: 'Image Generation',
    description: '文生图、图像编辑、风格化生成',
    models: [
      {
        id: 'black-forest-labs/flux-2-klein-4b',
        name: 'FLUX.2 Klein 4B',
        provider: 'Black Forest Labs',
        parameters: '4B',
        contextLength: 'N/A',
        license: 'Open',
        free: false,
      },
      {
        id: 'black-forest-labs/flux-1',
        name: 'FLUX.1',
        provider: 'Black Forest Labs',
        parameters: '~12B',
        contextLength: 'N/A',
        license: 'Open',
        free: false,
      },
      {
        id: 'stabilityai/stable-diffusion-xl',
        name: 'Stable Diffusion XL',
        provider: 'Stability AI',
        parameters: '3.5B',
        contextLength: 'N/A',
        license: 'Open',
        free: false,
      },
      {
        id: 'bytedance/seedream-4.5',
        name: 'Seedream 4.5',
        provider: 'ByteDance',
        parameters: 'Unknown',
        contextLength: 'N/A',
        license: 'Open',
        free: false,
      },
      {
        id: 'qwen/qwen-image',
        name: 'Qwen-Image',
        provider: 'Alibaba (Qwen)',
        parameters: 'Unknown',
        contextLength: 'N/A',
        license: 'Apache 2.0',
        free: false,
      },
      {
        id: 'tencent/hunyuan-image-3.0',
        name: 'HunyuanImage 3.0',
        provider: 'Tencent',
        parameters: 'Unknown',
        contextLength: 'N/A',
        license: 'Open',
        free: false,
      },
    ],
  },
];

/**
 * OpenRouter 开源模型使用分布 (来自 State of AI 2025 报告)
 *
 * 开源模型的用量分布:
 * - Roleplay / 创意写作: ~52%
 * - Programming / 编程:   ~25%
 * - Translation / 翻译:   ~8%
 * - General Knowledge:     ~6%
 * - Health / 医疗:         ~4%
 * - Other / 其他:          ~5%
 */
export const OSS_USAGE_DISTRIBUTION = [
  { category: 'Roleplay & Creative Writing', percentage: 52 },
  { category: 'Programming', percentage: 25 },
  { category: 'Translation', percentage: 8 },
  { category: 'General Knowledge', percentage: 6 },
  { category: 'Health', percentage: 4 },
  { category: 'Other', percentage: 5 },
];

/**
 * 按厂商分类的模型家族
 */
export const MODEL_PROVIDERS = [
  {
    provider: 'DeepSeek',
    origin: 'China',
    license: 'MIT',
    note: '性价比之王，V3.2达到GPT-5级别性能，成本仅1/50。注意：服务器在中国，有隐私风险。',
    families: ['DeepSeek R1', 'DeepSeek V3', 'DeepSeek V3.1', 'DeepSeek V3.2'],
  },
  {
    provider: 'Alibaba (Qwen)',
    origin: 'China',
    license: 'Apache 2.0',
    note: '最强多语言开源模型，支持29+语言。Qwen3 Coder是当前最强免费编程模型。',
    families: ['Qwen3', 'Qwen3 Coder', 'Qwen3 Next'],
  },
  {
    provider: 'Meta (Llama)',
    origin: 'US',
    license: 'Llama Community License',
    note: 'Llama 4 Scout支持10M上下文。有商用限制（700M MAU上限，不可用输出训练其他LLM）。',
    families: ['Llama 3.3', 'Llama 4 Maverick', 'Llama 4 Scout'],
  },
  {
    provider: 'Mistral',
    origin: 'France',
    license: 'Apache 2.0 / Modified MIT',
    note: '适合欧洲部署（EU数据驻留）、实时应用。Devstral专注多文件Agentic编程。',
    families: ['Mistral Small 3.1', 'Mistral Small 3.2', 'Devstral 2'],
  },
  {
    provider: 'Google (Gemma)',
    origin: 'US',
    license: 'Gemma License',
    note: '多模态强项，支持140+语言。Gemma 3n系列专为移动端/边缘设备优化。',
    families: ['Gemma 3', 'Gemma 3n'],
  },
  {
    provider: 'NVIDIA',
    origin: 'US',
    license: 'Open',
    note: 'Hybrid Mamba-Transformer架构，超长上下文。Nemotron Nano 2 VL支持视频理解。',
    families: ['Nemotron 3 Super', 'Nemotron 3 Nano', 'Nemotron Nano 2 VL'],
  },
  {
    provider: 'StepFun',
    origin: 'China',
    license: 'Open',
    note: 'Step 3.5 Flash: 196B参数仅激活11B，高效推理。',
    families: ['Step 3.5 Flash'],
  },
  {
    provider: 'OpenAI (Open-weight)',
    origin: 'US',
    license: 'Apache 2.0',
    note: 'GPT-OSS 120B是OpenAI首个开源权重模型，可在单张H100上运行。',
    families: ['GPT-OSS 120B'],
  },
  {
    provider: 'Arcee',
    origin: 'US',
    license: 'Open',
    note: 'Trinity Large: 400B MoE专注创意写作和角色扮演。',
    families: ['Trinity Large'],
  },
  {
    provider: 'MiniMax',
    origin: 'China',
    license: 'Open',
    note: '推荐用于Agent场景，免费可用。',
    families: ['MiniMax M2.5'],
  },
  {
    provider: 'Black Forest Labs',
    origin: 'Germany',
    license: 'Open',
    note: 'FLUX系列图像生成模型，Rectified Flow Transformer架构，优于Stable Diffusion的prompt adherence。',
    families: ['FLUX.1', 'FLUX.2'],
  },
  {
    provider: 'Stability AI',
    origin: 'UK',
    license: 'Open',
    note: 'SDXL拥有最大的社区生态（LoRA、Civitai checkpoints）。',
    families: ['Stable Diffusion XL'],
  },
  {
    provider: 'ByteDance',
    origin: 'China',
    license: 'Open',
    note: 'Seedream 4.5: 图像编辑一致性强，人像精修，小字渲染。',
    families: ['Seedream 4.5'],
  },
  {
    provider: 'Tencent',
    origin: 'China',
    license: 'Open',
    note: 'HunyuanImage 3.0: 支持超长prompt（千字级别），适合复杂构图。',
    families: ['HunyuanImage 3.0'],
  },
  {
    provider: 'Z.AI (Zhipu)',
    origin: 'China',
    license: 'Open',
    note: 'GLM-5 (744B): S-tier级别，Frontier竞争力的中国AI实验室。',
    families: ['GLM-5'],
  },
  {
    provider: 'Moonshot',
    origin: 'China',
    license: 'Open',
    note: 'Kimi K2.5 (1T): S-tier级别，支持100个子Agent和1500并行工具调用。',
    families: ['Kimi K2.5'],
  },
  {
    provider: 'Jina AI',
    origin: 'Germany',
    license: 'Apache 2.0',
    note: 'Jina Embeddings v4: 基于Qwen2.5-VL-3B的通用多模态/多语言嵌入模型。',
    families: ['Jina Embeddings v4'],
  },
  {
    provider: 'Nomic AI',
    origin: 'US',
    license: 'Apache 2.0',
    note: '首个MoE嵌入模型，支持~100种语言。',
    families: ['Nomic Embed Text V2'],
  },
];
