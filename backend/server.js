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

// Search insurance database
function searchDatabase(query) {
    const lowerQuery = query.toLowerCase();
    let results = [];

    // Search policies
    for (const [key, policy] of Object.entries(insuranceDatabase.policies)) {
        if (policy.name.toLowerCase().includes(lowerQuery)) {
            results.push(`Policy: ${policy.name}\nCoverage: ${policy.coverage.join(', ')}\nDeductibles: ${policy.deductibles.join(', ')}\nPremium: ${policy.premium}`);
        }
    }

    // Search claims
    for (const claim of insuranceDatabase.claims.examples) {
        if (
            claim.scenario.toLowerCase().includes(lowerQuery) ||
            claim.description.toLowerCase().includes(lowerQuery)
        ) {
            results.push(`Scenario: ${claim.scenario}\nClaim Type: ${claim.type}\nPolicy: ${claim.policy}\nDetails: ${claim.description}`);
        }
    }

    return results.length > 0
        ? results.join('\n\n')
        : 'No specific information found in our database. General information will be provided.';
}

// Chat endpoint with Ollama
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || message.trim() === '') {
            return res.status(400).json({ error: 'Message cannot be empty' });
        }

        // Search insurance database for relevant context
        const dbContext = searchDatabase(message);

        // Build context for Ollama
        const systemPrompt = `You are a helpful insurance policy assistant for an insurance company. 
You help customers understand their insurance policies, file claims, and answer questions about coverage.
You have access to the following information:\n\n${dbContext}\n\n
Always be helpful, clear, and professional. If you don't have specific information, guide the customer to contact support.`;

        const prompt = `${systemPrompt}\n\nCustomer Question: ${message}\n\nProvide a helpful and concise response.`;

        // Call Ollama API
        const response = await axios.post(
            OLLAMA_API,
            {
                model: 'tinyllama',
                prompt: prompt,
                stream: false,
                temperature: 0.7,
                top_p: 0.9
            },
        );

        const assistantResponse = response.data.response || 'I apologize, but I could not generate a response.';

        res.json({
            success: true,
            message: assistantResponse,
            context: dbContext
        });
    } catch (error) {
        console.error('Error calling Ollama:', error.message);

        // Fallback response if Ollama is not available
        if (error.code === 'ECONNREFUSED') {
            return res.status(503).json({
                success: false,
                error: 'AI service is currently unavailable. Please ensure Ollama is running on localhost:11434',
                fallback: 'Please try again later or contact support.'
            });
        }

        res.status(500).json({
            success: false,
            error: error.message,
            fallback: 'An error occurred while processing your request.'
        });
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

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Insurance Chatbot API running on http://localhost:${PORT}`);
    console.log(`Make sure Ollama is running on http://localhost:11434`);
});
