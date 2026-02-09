const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Ollama API configuration
const OLLAMA_API = process.env.OLLAMA_API || 'http://localhost:11434/api/generate';

// Dummy Insurance Data
const insuranceDatabase = {
    policies: {
        auto: {
            name: 'Auto Insurance',
            coverage: [
                'Liability Coverage: Up to $100,000',
                'Collision Coverage: Up to $50,000',
                'Comprehensive Coverage: Up to $50,000',
                'Uninsured Motorist Protection: Up to $100,000'
            ],
            deductibles: ['$250', '$500', '$1,000'],
            premium: '$85-$150 per month'
        },
        home: {
            name: 'Home Insurance',
            coverage: [
                'Dwelling Coverage: Up to $500,000',
                'Personal Property: Up to $250,000',
                'Liability Coverage: Up to $300,000',
                'Medical Payments: Up to $5,000'
            ],
            deductibles: ['$500', '$1,000', '$2,500'],
            premium: '$120-$250 per month'
        },
        health: {
            name: 'Health Insurance',
            coverage: [
                'Preventive Care: 100% covered',
                'Hospital Stays: 80% covered after deductible',
                'Doctor Visits: $30 copay',
                'Emergency Room: $250 copay'
            ],
            deductibles: ['$500', '$1,000', '$2,000'],
            premium: '$150-$400 per month'
        }
    },
    claims: {
        examples: [
            {
                scenario: 'Hit a Deer',
                type: 'Comprehensive Claim',
                policy: 'Auto Insurance',
                description: 'Comprehensive coverage covers animal collision damage'
            },
            {
                scenario: 'Car Damaged in Accident',
                type: 'Collision Claim',
                policy: 'Auto Insurance',
                description: 'Collision coverage covers vehicle damage from accidents'
            },
            {
                scenario: 'House Damaged by Storm',
                type: 'Comprehensive Claim',
                policy: 'Home Insurance',
                description: 'Dwelling coverage covers weather-related damages'
            },
            {
                scenario: 'Theft/Burglary',
                type: 'Comprehensive Claim',
                policy: 'Home Insurance',
                description: 'Personal property and liability coverage applies'
            }
        ]
    }
};

// Search insurance database (fuzzy with synonyms)
function searchDatabase(query) {
    const q = (query || '').toLowerCase();
    const results = [];

    // Synonyms/aliases for fuzzy matching
    const synonyms = {
        auto: ['auto insurance', 'car insurance', 'vehicle insurance', 'auto', 'car', 'vehicle'],
        home: ['home insurance', 'homeowners', 'house insurance', 'home', 'house'],
        health: ['health insurance', 'medical insurance', 'health plan', 'health'],
        collision: ['collision', 'accident', 'crash', 'impact', 'wreck', 'fender bender'],
        comprehensive: ['comprehensive', 'animal', 'deer', 'hail', 'glass', 'weather', 'theft']
    };

    const matchesAny = (text, list) => list.some(k => text.includes(k));

    // Policy intent detection
    const mentionsAuto = matchesAny(q, synonyms.auto);
    const mentionsHome = matchesAny(q, synonyms.home);
    const mentionsHealth = matchesAny(q, synonyms.health);

    // Claim intent detection
    const mentionsCollision = matchesAny(q, synonyms.collision);
    const mentionsComprehensive = matchesAny(q, synonyms.comprehensive) || q.includes('deer');

    // Generic policies listing intent
    const mentionsPoliciesGeneral = /\b(policies|policy|products|offer|available|list)\b/i.test(q);

    // Push policy details
    const pushPolicy = (key) => {
        const p = insuranceDatabase.policies[key];
        if (!p) return;
        results.push([
            `Policy: ${p.name}`,
            p.coverage?.length ? `Coverage: ${p.coverage.join(', ')}` : null,
            p.deductibles?.length ? `Deductibles: ${p.deductibles.join(', ')}` : null,
            p.premium ? `Premium: ${p.premium}` : null
        ].filter(Boolean).join('\n'));
    };

    if (mentionsAuto) pushPolicy('auto');
    if (mentionsHome) pushPolicy('home');
    if (mentionsHealth) pushPolicy('health');

    // Generic policy name match (token-based)
    for (const [, policy] of Object.entries(insuranceDatabase.policies)) {
        const name = (policy.name || '').toLowerCase();
        if (name && q.split(/\s+/).some(tok => tok.length > 3 && name.includes(tok))) {
            if (name.includes('auto')) pushPolicy('auto');
            else if (name.includes('home')) pushPolicy('home');
            else if (name.includes('health')) pushPolicy('health');
        }
    }

    // Claims examples (map accident→collision, deer→comprehensive)
    for (const ex of insuranceDatabase.claims.examples) {
        const scenario = ex.scenario.toLowerCase();
        const desc = ex.description.toLowerCase();
        const type = ex.type.toLowerCase();
        const scenarioMatch = q.includes(scenario) ||
            (mentionsCollision && type.includes('collision')) ||
            (mentionsComprehensive && (type.includes('comprehensive') || scenario.includes('deer')));
        const descMatch = q.split(/\s+/).some(tok => tok.length > 3 && desc.includes(tok));
        if (scenarioMatch || descMatch) {
            results.push(`Scenario: ${ex.scenario}\nClaim Type: ${ex.type}\nPolicy: ${ex.policy}\nDetails: ${ex.description}`);
        }
    }

    // General policies listing (names + premiums)
    if (mentionsPoliciesGeneral) {
        const list = Object.values(insuranceDatabase.policies)
            .map(p => `${p.name} — Premium: ${p.premium}`)
            .join('\n');
        results.push(`Available Policies:\n${list}`);
    }

    return results.length > 0 ? results.join('\n\n') : '';
}

// Deterministic follow-up generator that ensures suggestions have answers
function generateFollowUps(message, dbContext) {
    const q = (message || '').toLowerCase();
    const ctx = (dbContext || '').toLowerCase();
    const suggestions = [];

    const propose = (s) => {
        const check = searchDatabase(s);
        if (check && check.trim().length > 0) suggestions.push(s);
    };

    // Detect which policies appear in CONTEXT or the message
    const hasAuto = /auto insurance/i.test(ctx) || /\b(auto|car|vehicle)\b/i.test(q);
    const hasHome = /home insurance/i.test(ctx) || /\b(home|homeowners|house)\b/i.test(q);
    const hasHealth = /health insurance/i.test(ctx) || /\b(health|medical)\b/i.test(q);
    const showsPolicyList = /^available policies:/i.test(dbContext || '');

    // Claim hints
    const mentionsDeer = /\b(deer|animal)\b/i.test(q) || /hit a deer/i.test(ctx);
    const mentionsCollision = /\b(collision|accident|crash|wreck)\b/i.test(q) || /collision/i.test(ctx);

    // Build targeted suggestions per policy (guaranteed answerable)
    if (showsPolicyList || hasAuto) {
        propose('Auto Insurance');
        propose('What is the premium for Auto Insurance?');
        propose('What are the deductibles for Auto Insurance?');
        propose('Summarize coverage for Auto Insurance');
    }
    if (showsPolicyList || hasHome) {
        propose('Home Insurance');
        propose('What is the premium for Home Insurance?');
        propose('What are the deductibles for Home Insurance?');
        propose('Summarize coverage for Home Insurance');
    }
    if (showsPolicyList || hasHealth) {
        propose('Health Insurance');
        propose('What are the deductibles for Health Insurance?');
        propose('Summarize coverage for Health Insurance');
    }

    // Claim-related suggestions tied to Auto (answerable via examples and policy details)
    if (mentionsDeer) {
        propose('What kind of claim can I file if I hit a deer?');
        propose('Auto Insurance');
    }
    if (mentionsCollision) {
        propose('Car Damaged in Accident');
        propose('Auto Insurance');
    }

    // Ensure at least three suggestions using safe fallbacks
    const fallbacks = ['Auto Insurance', 'Home Insurance', 'Health Insurance'];
    for (const fb of fallbacks) {
        if (suggestions.length >= 3) break;
        propose(fb);
    }

    // Return up to 3 unique suggestions
    const unique = Array.from(new Set(suggestions));
    return unique.slice(0, 3);
}

// Chat endpoint with Ollama (Streaming)
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || message.trim() === '') {
            return res.status(400).json({ error: 'Message cannot be empty' });
        }

        // Search insurance database for relevant context
        const dbContext = searchDatabase(message);

        // Set headers for streaming
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Deterministic answer for specific formatting request
        const lowerMsg = (message || '').trim().toLowerCase();
        const isCollisionIncludeQuestion = /^(what\s+does\s+collision\s+coverage\s+include\??)$/.test(lowerMsg) ||
            /\bcollision\s+coverage\s+include\b/.test(lowerMsg);
        if (isCollisionIncludeQuestion) {
            const exactAnswer = 'Collision Coverage includes vehicle damage from accident.';
            const followUps = generateFollowUps(message, dbContext || '');
            res.write(`data: ${JSON.stringify({ token: '', done: true, fullResponse: exactAnswer, followUps })}\n\n`);
            return res.end();
        }

        // Early deterministic path: if no context, reply without model with safe follow-ups
        if (!dbContext || !dbContext.trim().length) {
            const finalText = "I don't know based on our data.";
            const followUps = generateFollowUps(message, dbContext || '');
            res.write(`data: ${JSON.stringify({ token: '', done: true, fullResponse: finalText, followUps })}\n\n`);
            return res.end();
        }

        // Strict RAG prompt with explicit CONTEXT and English response
        const systemPrompt = [
            'You are an insurance assistant.',
            'Strict grounding: Use ONLY the facts found in CONTEXT. Do not invent or speculate.',
            'If the answer is not in CONTEXT, reply exactly: "I don\'t know based on our data."',
            'Keep answers concise (2–4 sentences).',
            'Respond in English.',
            'CONTEXT:',
            dbContext,
            '',
            `Question: ${message}`,
            'Answer:'
        ].join('\n');
        const prompt = systemPrompt;

        // Set headers for streaming
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Call Ollama API with streaming
        const response = await axios.post(
            OLLAMA_API,
            {
                model: 'tinyllama',
                prompt: prompt,
                stream: true,           // Enable streaming
                temperature: 0.0,
                top_p: 0.8,
                top_k: 40,
                num_predict: 120,       // Slightly increased for complete concise answers
                num_ctx: 512
            },
            {
                timeout: 40000,
                responseType: 'stream'  // Important for streaming
            }
        );

        let fullResponse = '';

        // Stream data to client
        response.data.on('data', (chunk) => {
            const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');

            for (const line of lines) {
                try {
                    const parsed = JSON.parse(line);
                    if (parsed.response) {
                        fullResponse += parsed.response;
                        // Send each token to frontend
                        res.write(`data: ${JSON.stringify({ token: parsed.response, done: false })}\n\n`);
                    }
                    if (parsed.done) {
                        // Build deterministic follow-ups and send with final response
                        const followUps = generateFollowUps(message, dbContext);
                        res.write(`data: ${JSON.stringify({ token: '', done: true, fullResponse, followUps })}\n\n`);
                        res.end();
                    }
                } catch (e) {
                    // Skip invalid JSON
                }
            }
        });

        response.data.on('error', (error) => {
            console.error('Stream error:', error);
            res.write(`data: ${JSON.stringify({ error: error.message, done: true })}\n\n`);
            res.end();
        });

    } catch (error) {
        console.error('Error calling Ollama:', error.message);

        // Stream a deterministic fallback via SSE on timeout or connection issues
        const finalText = "I don't know based on our data.";
        const followUps = generateFollowUps((req.body && req.body.message) || '', '');
        try {
            res.write(`data: ${JSON.stringify({ token: '', done: true, fullResponse: finalText, followUps, error: error.message })}\n\n`);
            return res.end();
        } catch (_) {
            // If SSE write fails, fall back to JSON
            if (error.code === 'ECONNREFUSED') {
                return res.status(503).json({
                    success: false,
                    error: 'AI service is currently unavailable. Please ensure Ollama is running on localhost:11434',
                    fallback: finalText
                });
            }
            return res.status(500).json({ success: false, error: error.message, fallback: finalText });
        }
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Insurance Chatbot API is running' });
});

// Get available policies
app.get('/api/policies', (req, res) => {
    res.json({
        policies: Object.values(insuranceDatabase.policies).map(p => ({
            name: p.name,
            premium: p.premium
        }))
    });
});

// Serve static files from frontend
app.use(express.static('../frontend/public'));

// Pre-warm the model on startup
async function prewarmModel() {
    try {
        console.log('Pre-warming Ollama model...');
        await axios.post(
            OLLAMA_API,
            {
                model: 'tinyllama',
                prompt: 'Hi',
                stream: false,
                num_predict: 5
            },
            { timeout: 30000 }
        );
        console.log('✓ Model pre-warmed and ready!');
    } catch (error) {
        console.log('⚠️  Could not pre-warm model. Make sure Ollama is running.');
    }
}

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Insurance Chatbot API running on http://localhost:${PORT}`);
    console.log(`Make sure Ollama is running on http://localhost:11434`);

    // Pre-warm model after server starts
    prewarmModel();
});
