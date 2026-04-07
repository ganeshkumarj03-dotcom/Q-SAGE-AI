import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pool from '../db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const router = Router();

// ══════════════════════════════════════════════════════════
// Shared Gemini caller
// ══════════════════════════════════════════════════════════
// Only models confirmed to exist at v1beta endpoint for this API key
const GEMINI_MODELS = [
  'gemini-flash-latest',     // gemini-3-flash — 20 RPM free tier (confirmed working)
  'gemini-2.0-flash-001',    // gemini-2.0-flash stable release — fallback
];

async function callGemini(prompt, apiKey, maxTokens = 8192) {
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  for (const model of GEMINI_MODELS) {
    let lastErr = null;
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.4, maxOutputTokens: maxTokens },
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          const msg = data?.error?.message || `HTTP ${response.status}`;
          // Model not available / not found → skip to next model
          if (response.status === 404 || msg.includes('not found') || msg.includes('not supported') || msg.includes('INVALID_ARGUMENT')) {
            console.warn(`⚠️  ${model}: not available — skipping to next model.`);
            lastErr = new Error(msg);
            break;
          }
          // Zero free-tier quota → skip to next model
          if (msg.includes('limit: 0') || msg.includes('RESOURCE_EXHAUSTED')) {
            console.warn(`⚠️  ${model}: no free-tier quota — skipping.`);
            lastErr = new Error(msg);
            break;
          }
          // Rate-limited — back off and retry same model
          if (response.status === 429 || response.status >= 500) {
            const delay = (attempt + 1) * 8000;
            console.warn(`⚠️  ${model} rate-limited (attempt ${attempt + 1}/4) — retrying in ${delay / 1000}s…`);
            await sleep(delay);
            lastErr = new Error(msg);
            continue;
          }
          throw new Error(msg);
        }

        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error('Gemini returned an empty response.');
        console.log(`✅ Gemini response via ${model}`);
        return text;

      } catch (err) {
        if (err.message.includes('fetch') || err.message.includes('ECONNRESET')) {
          await sleep(2000);
          lastErr = err;
          continue;
        }
        throw err;
      }
    }
    if (lastErr) console.warn(`⚠️  All attempts failed for ${model}, trying next…`);
  }

  throw new Error('AI service is currently unavailable. Please try again in a moment.');
}


function extractJSON(text, type = 'array') {
  const pattern = type === 'array' ? /\[[\s\S]*\]/ : /\{[\s\S]*\}/;
  const match = text.match(pattern);
  if (!match) throw new Error('Could not parse AI response. Please try again.');
  return JSON.parse(match[0]);
}

// ══════════════════════════════════════════════════════════
// POST /api/ai/generate-questions  (faculty only)
// Generates questions WITHOUT answers — answers fetched separately
// ══════════════════════════════════════════════════════════
router.post('/generate-questions', authMiddleware, requireRole('faculty'), async (req, res) => {
  const {
    courseName = 'the course',
    courseCode = '',
    moduleName = 'Module 1',
    moduleTopics = '',
    difficulty = 'Medium',
    count = 10,
    questionType = 'Mixed',
  } = req.body;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Gemini API key not configured' });

  const difficultyGuide = {
    Easy: 'Focus on recall and basic understanding (BTL1-Remember, BTL2-Understand). Questions should test foundational knowledge clearly.',
    Medium: 'Mix of understanding, application, and analysis (BTL2-BTL4). Questions should require applying concepts to scenarios.',
    Hard: 'Focus on analysis, evaluation, and creation (BTL4-BTL6). Questions should require critical thinking, multi-step reasoning, and synthesis.',
  }[difficulty] || '';

  const typeGuide = {
    'MCQ': 'ALL questions must be Multiple Choice with exactly 4 options (a, b, c, d). Each option must be plausible and the wrong options must be common misconceptions.',
    'Short Answer': 'ALL questions must be short-answer type requiring 2-4 sentence responses. Each question worth 2-5 marks.',
    'Long Answer': 'ALL questions must be long-answer type with sub-parts (a), (b), (c) where applicable. Each question worth 10-16 marks. Require detailed explanations, derivations, or comparisons.',
    'Mixed': 'Mix of MCQ (1 mark), Short Answer (2-5 marks), and Long Answer (10-16 marks). Distribute evenly.',
  }[questionType] || '';

  const prompt = `You are a senior professor and expert question paper setter for a university-level engineering/science course.

COURSE: ${courseName} (${courseCode})
MODULE: ${moduleName}
TOPICS COVERED: ${moduleTopics || 'All standard topics in ' + moduleName}
DIFFICULTY LEVEL: ${difficulty}
DIFFICULTY GUIDANCE: ${difficultyGuide}
QUESTION TYPE: ${questionType}
TYPE GUIDANCE: ${typeGuide}
NUMBER OF QUESTIONS REQUIRED: ${count}

STRICT RULES FOR QUESTION QUALITY:
1. Questions must be specific, unambiguous, and academically rigorous — no trivially easy or vague questions.
2. Avoid starting multiple questions with the same verb. Use a variety of action verbs aligned with Bloom's taxonomy.
3. For Long Answer questions: always include sub-parts with clear point allocations e.g., "(a) Explain... (4 marks) (b) Derive... (6 marks)".
4. For MCQ: all 4 options must be grammatically consistent and exactly one must be correct.
5. For Short Answer: questions must have a precise, evaluable answer.
6. Bloom's Taxonomy Level (BTL) assignment MUST match the cognitive demand of the question.
7. Course Outcome (CO) assignment must be logical — CO1=Foundational knowledge, CO2=Understanding concepts, CO3=Application, CO4=Analysis, CO5=Evaluation, CO6=Design/Creation.
8. Marks allocation: MCQ=1, Short Answer=2-5, Long Answer=10-16.
9. Questions must be DIRECTLY relevant to the specified topics — no generic filler questions.
10. DO NOT repeat questions or paraphrase the same concept multiple times.

Generate EXACTLY ${count} questions. Return ONLY a valid JSON array (no markdown fences, no extra text):
[
  {
    "text": "Complete, well-formed question text here (include sub-parts for long answers)",
    "type": "MCQ | Short Answer | Long Answer",
    "btl": "BTL1-Remember | BTL2-Understand | BTL3-Apply | BTL4-Analyze | BTL5-Evaluate | BTL6-Create",
    "co": "CO1 | CO2 | CO3 | CO4 | CO5 | CO6",
    "difficulty": "${difficulty}",
    "marks": 2,
    "options": ["a) ...", "b) ...", "c) ...", "d) ..."]
  }
]
Note: "options" field should be an empty array [] for non-MCQ questions. Do NOT include "answer" field — answers will be generated separately.`;

  try {
    const rawText = await callGemini(prompt, apiKey, 8192);
    const questions = extractJSON(rawText, 'array');
    return res.json({ questions });
  } catch (err) {
    console.error('AI generate-questions error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

// ══════════════════════════════════════════════════════════
// POST /api/ai/generate-answers  (faculty only)
// Takes existing questions and generates model answers for them
// ══════════════════════════════════════════════════════════
router.post('/generate-answers', authMiddleware, requireRole('faculty'), async (req, res) => {
  const { questions = [], courseName = '', courseCode = '' } = req.body;
  if (!questions.length) return res.status(400).json({ error: 'No questions provided' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Gemini API key not configured' });

  const qList = questions.map((q, i) =>
    `Q${i + 1} [${q.type}, ${q.marks} marks, ${q.btl}, ${q.co}]: ${q.text}${q.options && q.options.length ? '\nOptions: ' + q.options.join(', ') : ''}`
  ).join('\n\n');

  const prompt = `You are a senior professor providing detailed model answers for a university exam question bank.

COURSE: ${courseName} (${courseCode})

Here are the questions that need model answers:
${qList}

For each question, provide a comprehensive model answer:
- For MCQ: state the correct option letter and a brief explanation of why it is correct.
- For Short Answer: 2–5 sentence clear, accurate explanation covering key points.
- For Long Answer: detailed answer with sub-parts coverage, key derivations, comparisons, or design explanations as needed.

Return ONLY a valid JSON array with exactly ${questions.length} items (same order as questions), each having only an "answer" field:
[
  { "answer": "Model answer text here" },
  ...
]`;

  try {
    const rawText = await callGemini(prompt, apiKey, 8192);
    const answers = extractJSON(rawText, 'array');
    // Merge answers back into questions
    const merged = questions.map((q, i) => ({
      ...q,
      answer: answers[i]?.answer || '',
    }));
    return res.json({ questions: merged });
  } catch (err) {
    console.error('AI generate-answers error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

// ══════════════════════════════════════════════════════════
// POST /api/ai/generate-paper  (faculty only)
// ══════════════════════════════════════════════════════════
router.post('/generate-paper', authMiddleware, requireRole('faculty'), async (req, res) => {
  const {
    courseName = 'the course',
    courseCode = '',
    institution = '',
    examType = 'Semester End Examination',
    totalMarks = 100,
    difficulty = 'Balanced',
    topics = '',
  } = req.body;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Gemini API key not configured' });

  const paperStructure = `
- PART A: Exactly 10 short-answer questions × 2 marks = 20 marks (BTL1-BTL3)
- PART B: Exactly 5 long-answer questions × 16 marks = 80 marks (BTL3-BTL6)
  Each Part B question has two alternatives: (a) main question [16 marks] OR (b) alternate question [16 marks]
  Sub-parts allowed: e.g. (i) 8 marks + (ii) 8 marks
Total = 100 marks`;

  const prompt = `You are a senior professor setting a university-level examination question paper in the exact format of a real Indian engineering college exam.

INSTITUTION: ${institution || 'University Examination'}
COURSE: ${courseName} (${courseCode})
EXAM TYPE: ${examType}
TOTAL MARKS: ${totalMarks}
DIFFICULTY: ${difficulty}
TOPICS/SYLLABUS: ${topics || 'All standard topics covered in ' + courseName}

PAPER STRUCTURE TO FOLLOW:
${paperStructure}

STRICT QUALITY RULES:
1. Part A: EXACTLY 10 questions, each 2 marks, concise and specific.
2. Part B: EXACTLY 5 question sets (Q11–Q15). Each set has part (a) OR part (b), each worth 16 marks.
3. Part B sub-parts marked clearly: e.g. "(i) Explain X (8 marks)\n(ii) Derive Y (8 marks)".
4. Every question assigned BTL level and CO mapping.
5. CO mapping logical and varied (CO1–CO5 spread across the paper).
6. Questions SPECIFIC to course topics.

Return ONLY a valid JSON object (no markdown, no extra text):
{
  "sections": [
    {
      "title": "PART A — (10 × 2 = 20 marks)",
      "instruction": "Answer ALL Questions",
      "totalMarks": 20,
      "questions": [
        {
          "text": "Question text here",
          "type": "Short Answer",
          "btl": "BTL2-Understand",
          "co": "CO1",
          "marks": 2,
          "answer": "Key points for model answer"
        }
      ]
    },
    {
      "title": "PART B — (5 × 16 = 80 marks)",
      "instruction": "Answer ALL FIVE Questions",
      "totalMarks": 80,
      "questions": [
        {
          "partA": {
            "text": "(i) Sub-question one (8 marks)\\n(ii) Sub-question two (8 marks)",
            "btl": "BTL4-Analyze",
            "co": "CO2",
            "marks": 16,
            "answer": "Model answer key points"
          },
          "partB": {
            "text": "Alternate question text (16 marks)",
            "btl": "BTL3-Apply",
            "co": "CO2",
            "marks": 16,
            "answer": "Model answer key points"
          }
        }
      ]
    }
  ]
}`;

  try {
    const rawText = await callGemini(prompt, apiKey, 12000);
    const paper = extractJSON(rawText, 'object');
    return res.json({ paper });
  } catch (err) {
    console.error('AI generate-paper error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

// ══════════════════════════════════════════════════════════
// POST /api/ai/generate-mock-test  (student)
// Supports questionTypeFilter: 'MCQ' | 'Short Answer' | 'Mixed'
// ══════════════════════════════════════════════════════════
router.post('/generate-mock-test', authMiddleware, async (req, res) => {
  const {
    courseName = 'the course',
    courseCode = '',
    topics = '',
    questionCount = 10,
    questionTypeFilter = 'Mixed',
  } = req.body;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Gemini API key not configured' });

  const typeLine = questionTypeFilter === 'MCQ'
    ? `ALL ${questionCount} questions MUST be MCQ type with 4 options (a, b, c, d) and 1 mark each.`
    : questionTypeFilter === 'Short Answer'
      ? `ALL ${questionCount} questions MUST be Short Answer type requiring 2-3 sentence answers, worth 3 marks each.`
      : `Mix: approximately 60% MCQ (1 mark each) and 40% Short Answer (3 marks each), total ${questionCount} questions.`;

  const prompt = `You are an AI tutor creating a mock test for a university student.

COURSE: ${courseName} (${courseCode})
TOPICS: ${topics || 'All standard topics in ' + courseName}
NUMBER OF QUESTIONS: ${questionCount}
QUESTION TYPE REQUIREMENT: ${typeLine}

RULES:
1. Questions must be educationally valuable — test real understanding, not just memorization.
2. MCQ wrong options must be plausible common misconceptions.
3. Short answer questions must have clear, verifiable answers.
4. Cover different topics from the syllabus — do not repeat similar concepts.
5. Progress from easier to harder questions.
6. Each question must have a clear correct answer that a student can self-evaluate.

Return ONLY a valid JSON array (no markdown, no extra text):
[
  {
    "id": 1,
    "text": "Question text here",
    "type": "MCQ",
    "marks": 1,
    "options": ["a) ...", "b) ...", "c) ...", "d) ..."],
    "correctAnswer": "a",
    "explanation": "Brief explanation of why the correct answer is right"
  },
  {
    "id": 2,
    "text": "Short answer question here",
    "type": "Short Answer",
    "marks": 3,
    "options": [],
    "correctAnswer": "Model answer: ...",
    "explanation": "Key points the student must mention"
  }
]`;

  try {
    const rawText = await callGemini(prompt, apiKey, 6000);
    const questions = extractJSON(rawText, 'array');
    return res.json({ questions });
  } catch (err) {
    console.error('AI generate-mock-test error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

// ══════════════════════════════════════════════════════════
// POST /api/ai/rag-chat  (faculty only) — General AI Chat
// ══════════════════════════════════════════════════════════
router.post('/rag-chat', authMiddleware, requireRole('faculty'), async (req, res) => {
  const {
    prompt = '',
    conversationHistory = [],
  } = req.body;

  if (!prompt.trim()) return res.status(400).json({ error: 'Prompt is required' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Gemini API key not configured' });

  // Build conversation context
  const historyText = conversationHistory
    .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n');

  const systemPrompt = `You are Go Chat — a smart, fast, friendly AI assistant like ChatGPT or Gemini. You answer ANYTHING the user asks directly and helpfully.

RULES:
- Give direct answers. NEVER ask the user a question back unless absolutely necessary to clarify something.
- Cover any topic: technology, science, history, maths, programming, general knowledge, recipes, travel, news topics — everything.
- If the user asks about something that has a useful link or reference, include it naturally in your response.
- Format responses clearly with **bold**, bullet points, or code blocks when it helps readability.
- Be concise but thorough. Don't pad answers unnecessarily.
- Be conversational and friendly, not robotic.
- If you don't know something, say so honestly — don't make things up.

${historyText ? `CONVERSATION SO FAR:\n${historyText}\n` : ''}
User: ${prompt}
Go Chat:`;

  try {
    const rawText = await callGemini(systemPrompt, apiKey, 4096);
    return res.json({ response: rawText });
  } catch (err) {
    console.error('AI rag-chat error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

// ══════════════════════════════════════════════════════════
// POST /api/ai/parse-syllabus/:id  (faculty only)
// Reads the uploaded syllabus file and extracts 5 unit names + topics via Gemini
// ══════════════════════════════════════════════════════════
router.post('/parse-syllabus/:id', authMiddleware, requireRole('faculty'), async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Gemini API key not configured' });

  try {
    // Fetch syllabus DB record
    const [rows] = await pool.query('SELECT * FROM syllabi WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Syllabus not found' });
    const syllabus = rows[0];

    let syllabusText = '';

    // Try to read file text
    if (syllabus.file_path) {
      const filePath = join(__dirname, '..', 'uploads', syllabus.file_path);
      if (fs.existsSync(filePath)) {
        const ext = path.extname(syllabus.file_path).toLowerCase();
        if (ext === '.txt') {
          syllabusText = fs.readFileSync(filePath, 'utf-8');
        } else if (ext === '.pdf') {
          // Read raw PDF bytes as base64 for Gemini vision — but since we can't send binary
          // we'll fall back to telling Gemini just the course name + code and let it generate
          // typical units. A future enhancement would use pdf-parse here.
          syllabusText = `[PDF file detected: ${syllabus.file_path}]`;
        } else {
          syllabusText = fs.readFileSync(filePath, 'utf-8').slice(0, 6000);
        }
      }
    }

    const hasRealText = syllabusText && !syllabusText.startsWith('[PDF');
    const contextLine = hasRealText
      ? `SYLLABUS FILE CONTENT:\n${syllabusText.slice(0, 5000)}`
      : `The course is "${syllabus.course_name}" (${syllabus.course_code}). Generate typical units for this subject.`;

    const prompt = `You are an expert at reading Indian university engineering syllabi.

${contextLine}

Based on the above, extract or infer exactly 5 unit names and their syllabus topics from the syllabus for the course "${syllabus.course_name}" (${syllabus.course_code}).

Return ONLY a valid JSON array (no markdown, no explanation):
[
  {
    "unitLabel": "I",
    "name": "Unit title here",
    "syllabus": "Comma-separated or dash-listed key topics covered in this unit"
  },
  { "unitLabel": "II", "name": "...", "syllabus": "..." },
  { "unitLabel": "III", "name": "...", "syllabus": "..." },
  { "unitLabel": "IV", "name": "...", "syllabus": "..." },
  { "unitLabel": "V", "name": "...", "syllabus": "..." }
]`;

    const rawText = await callGemini(prompt, apiKey, 4096);
    const units = extractJSON(rawText, 'array');

    return res.json({
      courseName: syllabus.course_name,
      courseCode: syllabus.course_code,
      semester: syllabus.semester || '',
      units: units.slice(0, 5),
    });
  } catch (err) {
    console.error('AI parse-syllabus error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

// ══════════════════════════════════════════════════════════
// POST /api/ai/generate-qbank  (faculty only)
// Generates a full 5-unit Question Bank: PART-A (2 marks) + PART-B (16 marks)
// ══════════════════════════════════════════════════════════
router.post('/generate-qbank', authMiddleware, requireRole('faculty'), async (req, res) => {
  const {
    courseName = 'the course',
    courseCode = '',
    units = [],  // array of { name, syllabus } — expected 5 items
  } = req.body;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Gemini API key not configured' });
  if (!units.length) return res.status(400).json({ error: 'Please provide unit details' });

  const BTL_COMPETENCE = {
    BTL1: 'Remembering',
    BTL2: 'Understanding',
    BTL3: 'Applying',
    BTL4: 'Analyzing',
    BTL5: 'Evaluating',
    BTL6: 'Creating',
  };

  try {
    const generatedUnits = [];

    for (let i = 0; i < units.length; i++) {
      const unit = units[i];
      const unitNo = i + 1;
      const unitLabel = ['I', 'II', 'III', 'IV', 'V'][i] || String(unitNo);

      const prompt = `You are a senior university professor setting a formal Question Bank for Indian engineering colleges.

COURSE: ${courseName} (${courseCode})
UNIT ${unitLabel}: ${unit.name}
SYLLABUS TOPICS: ${unit.syllabus || unit.name}

Generate questions in EXACTLY the following JSON format for this unit.
RULES:
- PART-A: Exactly 20 short-answer questions worth 2 marks each. These should be direct, concise questions testing recall and basic understanding (BTL1 and BTL2).
- PART-B: Exactly 20 long-answer questions worth 16 marks each. These should require detailed explanations, designs, justifications, derivations, or comparisons (BTL3–BTL6).
- BTL levels for PART-A: mix of BTL1 (Remembering) and BTL2 (Understanding).
- BTL levels for PART-B: mix of BTL3 (Applying), BTL4 (Analyzing), BTL5 (Evaluating), BTL6 (Creating).
- Competence must match BTL: BTL1→Remembering, BTL2→Understanding, BTL3→Applying, BTL4→Analyzing, BTL5→Evaluating, BTL6→Creating.
- All questions must be directly relevant to the syllabus topics listed above.
- No repetition. Each question tests a distinct concept or skill.
- PART-B questions should be standalone 16-mark long-answer questions (not OR-choice format).

Return ONLY a valid JSON object (no markdown fences, no explanation):
{
  "partA": [
    { "text": "Short answer question here?", "btl": "BTL1", "competence": "Remembering" }
  ],
  "partB": [
    { "text": "Long answer question here?", "btl": "BTL4", "competence": "Analyzing" }
  ]
}`;

      const rawText = await callGemini(prompt, apiKey, 8192);
      const parsed = extractJSON(rawText, 'object');

      generatedUnits.push({
        unitNo,
        unitLabel,
        unitName: unit.name,
        syllabus: unit.syllabus,
        partA: (parsed.partA || []).map((q, qi) => ({ no: qi + 1, ...q })),
        partB: (parsed.partB || []).map((q, qi) => ({ no: qi + 1, marks: 16, ...q })),
      });
    }

    return res.json({ units: generatedUnits });
  } catch (err) {
    console.error('AI generate-qbank error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

export default router;
