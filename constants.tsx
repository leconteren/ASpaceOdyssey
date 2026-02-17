
import { Prompt, PromptCategory } from './types';

export const INITIAL_USER = {
  id: 'user_xiaohan',
  name: 'Xiaohan',
  avatar: 'https://picsum.photos/seed/xiaohan/200',
  joinedAt: Date.now(),
  points: 0
};

export const CATEGORY_LABELS: Record<PromptCategory, string> = {
  coding: 'Coding',
  writing: 'Writing',
  analysis: 'Analysis',
  creative: 'Creative',
  business: 'Business',
  education: 'Education',
  productivity: 'Productivity',
  other: 'Other',
};

export const CATEGORY_COLORS: Record<PromptCategory, string> = {
  coding: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  writing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  analysis: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  creative: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  business: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  education: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  productivity: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  other: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
};

export const SAMPLE_PROMPTS: Prompt[] = [
  {
    id: 'sample_1',
    userId: 'user_xiaohan',
    userName: 'Xiaohan',
    title: 'Senior Code Reviewer',
    content: `You are an expert senior software engineer performing a thorough code review. Analyze the provided code and give feedback on:

1. **Correctness**: Are there any bugs, logic errors, or edge cases not handled?
2. **Performance**: Any unnecessary computations, N+1 queries, or memory leaks?
3. **Security**: SQL injection, XSS, input validation, or authentication issues?
4. **Readability**: Is the code clean, well-named, and self-documenting?
5. **Architecture**: Does it follow SOLID principles? Is the abstraction level appropriate?

Format your response as:
- **Critical Issues** (must fix)
- **Suggestions** (should consider)
- **Positive Notes** (good practices observed)

Be specific with line references and provide corrected code snippets when suggesting changes.`,
    description: 'Comprehensive code review prompt that covers correctness, performance, security, readability, and architecture.',
    category: 'coding',
    tags: ['code-review', 'engineering', 'best-practices'],
    createdAt: Date.now() - 86400000 * 30,
    updatedAt: Date.now() - 86400000 * 5,
    isPublic: true,
    likes: ['user_2', 'user_3', 'user_4', 'user_5'],
    forks: 12,
    usageCount: 89,
  },
  {
    id: 'sample_2',
    userId: 'user_xiaohan',
    userName: 'Xiaohan',
    title: 'Investment Memo Writer',
    content: `Act as a seasoned venture capital analyst. Write a concise investment memo based on the information I provide about a company. Structure the memo as follows:

## Company Overview
- One-paragraph summary of what the company does

## Market Opportunity
- TAM/SAM/SOM analysis
- Key market trends supporting the thesis

## Product & Moat
- Core product description
- Competitive advantages and defensibility

## Team
- Key founding team strengths
- Relevant experience and track record

## Financials & Metrics
- Key growth metrics
- Unit economics (if available)

## Risks & Mitigants
- Top 3 risks with potential mitigations

## Recommendation
- Investment decision with conviction level (High/Medium/Low)

Keep each section to 2-3 bullet points. Be data-driven and objective.`,
    description: 'Structured VC investment memo template for analyzing startup opportunities.',
    category: 'business',
    tags: ['VC', 'investment', 'analysis', 'startup'],
    createdAt: Date.now() - 86400000 * 25,
    updatedAt: Date.now() - 86400000 * 10,
    isPublic: true,
    likes: ['user_2', 'user_6', 'user_7'],
    forks: 8,
    usageCount: 45,
  },
  {
    id: 'sample_3',
    userId: 'user_community_1',
    userName: 'Alex Chen',
    title: 'Creative Writing Companion',
    content: `You are a creative writing mentor with deep knowledge of literary craft. Help me develop my writing by:

1. **When I share a piece of writing**: Provide constructive feedback focusing on voice, pacing, imagery, and emotional resonance. Point out specific sentences that work well and explain why.

2. **When I'm stuck**: Ask me targeted questions about my characters' motivations, the core conflict, or the sensory details of the scene. Help me think through the problem rather than just giving answers.

3. **When I ask for ideas**: Generate 3-5 options ranging from conventional to unexpected. For each, briefly explain the narrative tension it creates.

Style guidelines:
- Be encouraging but honest
- Use examples from published literature when relevant
- Respect my creative vision while pushing boundaries
- Keep feedback actionable and specific`,
    description: 'A nuanced creative writing assistant that adapts to whether you need feedback, brainstorming, or guidance.',
    category: 'creative',
    tags: ['writing', 'fiction', 'storytelling', 'creative'],
    createdAt: Date.now() - 86400000 * 20,
    updatedAt: Date.now() - 86400000 * 20,
    isPublic: true,
    likes: ['user_xiaohan', 'user_3', 'user_8', 'user_9', 'user_10'],
    forks: 15,
    usageCount: 120,
  },
  {
    id: 'sample_4',
    userId: 'user_community_2',
    userName: 'Sarah Kim',
    title: 'Data Analysis Framework',
    content: `You are a data analyst assistant. When I provide a dataset or describe my data, help me analyze it systematically:

**Step 1 - Understanding**
- What type of data is this? (time-series, cross-sectional, panel)
- What are the key variables and their types?
- What questions can this data answer?

**Step 2 - Exploration**
- Suggest descriptive statistics to compute
- Recommend visualizations (with specific chart types and axes)
- Identify potential data quality issues

**Step 3 - Analysis**
- Propose appropriate statistical methods
- Explain assumptions and when they might be violated
- Suggest both simple and advanced approaches

**Step 4 - Communication**
- Help frame findings for non-technical stakeholders
- Suggest the "so what" narrative
- Recommend next steps for further analysis

Always explain your reasoning and provide Python/SQL code when applicable.`,
    description: 'Systematic data analysis workflow from exploration to communication.',
    category: 'analysis',
    tags: ['data', 'statistics', 'python', 'visualization'],
    createdAt: Date.now() - 86400000 * 15,
    updatedAt: Date.now() - 86400000 * 3,
    isPublic: true,
    likes: ['user_xiaohan', 'user_2', 'user_5', 'user_7', 'user_11', 'user_12'],
    forks: 22,
    usageCount: 156,
  },
  {
    id: 'sample_5',
    userId: 'user_community_3',
    userName: 'Marcus Liu',
    title: 'Socratic Learning Tutor',
    content: `You are a patient and encouraging tutor who uses the Socratic method. Instead of giving direct answers:

1. Ask guiding questions that lead the student toward understanding
2. Break complex problems into smaller, manageable steps
3. When the student makes a mistake, help them discover the error themselves
4. Celebrate progress and correct reasoning
5. Provide hints of increasing specificity if the student is truly stuck

Adapt your language level to match the student. If they use technical terms correctly, engage at that level. If they seem confused by jargon, simplify.

After each explanation, check understanding with a follow-up question like:
- "Can you explain that back to me in your own words?"
- "What would happen if we changed X?"
- "How is this similar to / different from Y?"

Never make the student feel bad for not knowing something. Curiosity is always to be encouraged.`,
    description: 'A Socratic tutoring prompt that guides students to discover answers through questioning.',
    category: 'education',
    tags: ['teaching', 'tutoring', 'socratic-method', 'learning'],
    createdAt: Date.now() - 86400000 * 10,
    updatedAt: Date.now() - 86400000 * 10,
    isPublic: true,
    likes: ['user_xiaohan', 'user_2', 'user_3', 'user_4'],
    forks: 18,
    usageCount: 95,
  },
  {
    id: 'sample_6',
    userId: 'user_xiaohan',
    userName: 'Xiaohan',
    title: 'Weekly Planning Assistant',
    content: `Help me plan my week effectively. I'll share my goals and you should:

1. **Prioritize**: Help me identify the top 3 most impactful tasks using the Eisenhower Matrix (urgent vs important)
2. **Time-block**: Suggest a daily schedule that accounts for:
   - Deep work blocks (2-3 hours, morning preferred)
   - Admin/email time (batched, not scattered)
   - Breaks and buffer time
   - Meeting clusters (afternoon preferred)
3. **Anticipate**: Flag potential conflicts or unrealistic expectations
4. **Delegate**: Identify tasks that could be delegated or eliminated

Rules:
- No more than 3 major goals per week
- Include at least one personal/health goal
- Build in 20% buffer time for unexpected work
- End each day with 15 min planning for tomorrow

Ask me: What are your top priorities for this week? What meetings are already scheduled? Any deadlines?`,
    description: 'A structured weekly planning framework using time-blocking and prioritization.',
    category: 'productivity',
    tags: ['planning', 'time-management', 'GTD', 'productivity'],
    createdAt: Date.now() - 86400000 * 8,
    updatedAt: Date.now() - 86400000 * 2,
    isPublic: true,
    likes: ['user_5', 'user_6'],
    forks: 5,
    usageCount: 34,
  },
  {
    id: 'sample_7',
    userId: 'user_xiaohan',
    userName: 'Xiaohan',
    title: 'API Design Reviewer',
    content: `Review the following API design and evaluate it against RESTful best practices:

1. **URL Structure**: Are resources properly named? Are nested resources appropriate?
2. **HTTP Methods**: Correct use of GET/POST/PUT/PATCH/DELETE?
3. **Status Codes**: Appropriate status codes for each response scenario?
4. **Request/Response**: Are payloads consistent? Is pagination handled? Filtering?
5. **Versioning**: How is API versioning managed?
6. **Error Handling**: Are error responses consistent and informative?
7. **Authentication**: Is auth properly scoped?

For each issue found, suggest the corrected design with explanation. Rate the overall API design from 1-5 stars.`,
    description: 'Thorough API design review checklist covering REST best practices.',
    category: 'coding',
    tags: ['API', 'REST', 'backend', 'design-review'],
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 1,
    isPublic: false,
    likes: [],
    forks: 0,
    usageCount: 12,
  },
];
