const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Ollama API configuration
const OLLAMA_API = process.env.OLLAMA_API || 'http://localhost:11434/api/generate';

// Comprehensive Insurance Database for POC Demo
const insuranceDatabase = {
    policies: {
        auto: {
            name: 'Auto Insurance',
            description: 'Comprehensive vehicle protection for cars, trucks, and motorcycles',
            coverage: [
                'Liability Coverage: Up to $100,000 for bodily injury and property damage',
                'Collision Coverage: Up to $50,000 for vehicle damage from accidents',
                'Comprehensive Coverage: Up to $50,000 for non-collision damage (theft, vandalism, natural disasters)',
                'Uninsured Motorist Protection: Up to $100,000 if hit by uninsured driver',
                'Personal Injury Protection: Medical expenses up to $10,000',
                'Roadside Assistance: 24/7 towing, flat tire, lockout service included'
            ],
            deductibles: ['$250 (higher premium)', '$500 (recommended)', '$1,000 (lower premium)'],
            premium: '$85-$150 per month depending on vehicle, age, and driving record',
            benefits: [
                'Accident forgiveness after 3 years claim-free',
                'Multi-car discount up to 25%',
                'Safe driver discount up to 30%',
                'Online claims processing within 24 hours'
            ]
        },
        home: {
            name: 'Home Insurance',
            description: 'Complete protection for your home, belongings, and liability',
            coverage: [
                'Dwelling Coverage: Up to $500,000 for home structure repair/rebuild',
                'Personal Property: Up to $250,000 for furniture, electronics, clothing',
                'Liability Coverage: Up to $300,000 for injuries on your property',
                'Medical Payments: Up to $5,000 for guest injuries',
                'Additional Living Expenses: Hotel/rent if home uninhabitable',
                'Water Damage Protection: Burst pipes, roof leaks covered'
            ],
            deductibles: ['$500 (storms/theft)', '$1,000 (recommended)', '$2,500 (earthquakes)'],
            premium: '$120-$250 per month based on home value, location, age',
            benefits: [
                'Home security system discount 15%',
                'Bundling with auto saves 20%',
                'New home discount 10%',
                'Claims-free discount increases yearly'
            ]
        },
        health: {
            name: 'Health Insurance',
            description: 'Comprehensive medical coverage for individuals and families',
            coverage: [
                'Preventive Care: 100% covered (annual checkups, vaccinations, screenings)',
                'Hospital Stays: 80% covered after deductible (surgeries, ICU)',
                'Doctor Visits: $30 copay for primary care, $50 specialist',
                'Emergency Room: $250 copay (waived if admitted)',
                'Prescription Drugs: Generic $10, Brand $35, Specialty 20%',
                'Mental Health: Therapy sessions $30 copay, unlimited visits',
                'Maternity Care: Prenatal, delivery, postnatal 100% covered'
            ],
            deductibles: ['$500 individual/$1,000 family', '$1,000 individual/$2,000 family', '$2,000 individual/$4,000 family'],
            premium: '$150-$400 per month for individual, $500-$1,200 for family',
            benefits: [
                'Nationwide network of 50,000+ doctors',
                'Telemedicine visits $0 copay',
                'Wellness program rewards',
                'HSA compatible plans available'
            ]
        },
        life: {
            name: 'Life Insurance',
            description: 'Financial protection for your loved ones',
            coverage: [
                'Term Life: $100,000 - $1,000,000 coverage for 10, 20, or 30 years',
                'Whole Life: Permanent coverage with cash value accumulation',
                'Accidental Death: Double payout for accidental death',
                'Child Riders: $10,000-$25,000 coverage for children'
            ],
            premium: '$25-$200 per month based on age, health, coverage amount',
            benefits: [
                'No medical exam for amounts under $250,000',
                'Guaranteed level premiums',
                'Living benefits for terminal illness',
                'Convertible to whole life insurance'
            ]
        }
    },
    claims: {
        examples: [
            {
                scenario: 'Hit a Deer',
                type: 'Comprehensive Claim',
                policy: 'Auto Insurance',
                description: 'Animal collisions are covered under comprehensive coverage, not collision. File within 48 hours with photos of damage.',
                process: '1) Call us immediately 2) Get vehicle to approved repair shop 3) Adjuster inspects within 24 hours 4) Repairs approved in 2-3 days',
                averageSettlement: '$2,000-$5,000',
                deductibleApplies: true
            },
            {
                scenario: 'Car Damaged in Accident',
                type: 'Collision Claim',
                policy: 'Auto Insurance',
                description: 'Collision coverage pays for vehicle damage from accidents with other cars or objects. Your deductible applies.',
                process: '1) Exchange insurance info at scene 2) File police report 3) Submit claim online 4) Get repair estimate 5) Rental car provided',
                averageSettlement: '$3,500-$8,000',
                deductibleApplies: true
            },
            {
                scenario: 'House Damaged by Storm',
                type: 'Property Damage Claim',
                policy: 'Home Insurance',
                description: 'Dwelling and personal property coverage applies for wind, hail, and storm damage. Take photos before cleanup.',
                process: '1) Document all damage with photos 2) Prevent further damage 3) File claim within 72 hours 4) Adjuster visit 5) Receive settlement',
                averageSettlement: '$8,000-$50,000',
                deductibleApplies: true
            },
            {
                scenario: 'Theft or Burglary',
                type: 'Personal Property Claim',
                policy: 'Home Insurance',
                description: 'Personal property coverage pays for stolen items. File police report first, then submit itemized list with receipts if available.',
                process: '1) File police report immediately 2) List stolen items with values 3) Submit claim with photos/receipts 4) Settlement in 7-10 days',
                averageSettlement: '$5,000-$20,000',
                deductibleApplies: true
            },
            {
                scenario: 'Medical Emergency',
                type: 'Health Claim',
                policy: 'Health Insurance',
                description: 'Emergency room visits covered at 80% after copay. Use network hospitals when possible for better coverage.',
                process: '1) Show insurance card at hospital 2) Pay copay 3) Claims auto-filed by hospital 4) Receive explanation of benefits 5) Pay remaining balance',
                averageSettlement: 'Auto-processed',
                deductibleApplies: true
            },
            {
                scenario: 'Routine Doctor Visit',
                type: 'Health Claim',
                policy: 'Health Insurance',
                description: 'Primary care visits require only copay. Annual wellness exams covered at 100% with no copay.',
                process: 'Simple $30 copay at visit, no claim filing needed',
                averageSettlement: 'Copay only',
                deductibleApplies: false
            }
        ]
    },
    contactInfo: {
        customerService: '1-800-555-INSURE (1-800-555-4678)',
        claimsHotline: '1-800-555-CLAIM (24/7)',
        email: 'support@insureassist.com',
        website: 'www.insureassist.com',
        mobileApp: 'Download InsureAssist app on iOS/Android'
    },
    faq: {
        deductibles: 'A deductible is what you pay before insurance covers the rest. Higher deductible = lower premium.',
        premium: 'Premium is your monthly payment to keep insurance active.',
        coverage: 'Coverage is the protection amount insurance pays for covered incidents.',
        claim: 'A claim is a request for insurance to pay for a covered loss.',
        beneficiary: 'Person who receives life insurance payout when policyholder passes away.'
    }
};

// Enhanced search function with comprehensive data matching
function searchDatabase(query) {
    const lowerQuery = query.toLowerCase();
    let results = [];
    let matchedSections = [];

    // Search policies with full details
    for (const [key, policy] of Object.entries(insuranceDatabase.policies)) {
        // Check if query matches policy name, description, OR any coverage item
        const nameMatch = policy.name.toLowerCase().includes(lowerQuery) || lowerQuery.includes(key);
        const descMatch = policy.description.toLowerCase().includes(lowerQuery);
        const coverageMatch = policy.coverage.some(item => item.toLowerCase().includes(lowerQuery));

        if (nameMatch || descMatch || coverageMatch) {
            matchedSections.push(`Policy: ${policy.name}`);
            let policyInfo = `${policy.name}: ${policy.description}\n`;
            policyInfo += `Coverage: ${policy.coverage.slice(0, 3).join('; ')}\n`;
            if (policy.deductibles) {
                policyInfo += `Deductibles: ${policy.deductibles.join(', ')}\n`;
            }
            policyInfo += `Premium: ${policy.premium}`;
            if (policy.benefits) {
                policyInfo += `\nKey Benefits: ${policy.benefits.slice(0, 2).join('; ')}`;
            }
            results.push(policyInfo);
        }
    }

    // Search claims with process details
    for (const claim of insuranceDatabase.claims.examples) {
        if (claim.scenario.toLowerCase().includes(lowerQuery) ||
            claim.description.toLowerCase().includes(lowerQuery) ||
            claim.type.toLowerCase().includes(lowerQuery)) {

            matchedSections.push(`Claim: ${claim.scenario}`);

            let claimInfo = `${claim.scenario} - ${claim.type}\n`;
            claimInfo += `Details: ${claim.description}\n`;
            if (claim.process) {
                claimInfo += `Process: ${claim.process}\n`;
            }
            if (claim.averageSettlement) {
                claimInfo += `Typical Settlement: ${claim.averageSettlement}`;
            }
            results.push(claimInfo);
        }
    }

    // Search FAQ
    for (const [term, definition] of Object.entries(insuranceDatabase.faq)) {
        if (lowerQuery.includes(term)) {
            matchedSections.push(`FAQ: ${term}`);
            results.push(`${term.charAt(0).toUpperCase() + term.slice(1)}: ${definition}`);
        }
    }

    // Add contact info if query is about contact/help/support
    if (lowerQuery.includes('contact') || lowerQuery.includes('call') ||
        lowerQuery.includes('phone') || lowerQuery.includes('help') ||
        lowerQuery.includes('support')) {
        matchedSections.push('Contact Information');
        results.push(`Contact: ${insuranceDatabase.contactInfo.customerService}\nClaims Hotline: ${insuranceDatabase.contactInfo.claimsHotline} (24/7)\nEmail: ${insuranceDatabase.contactInfo.email}`);
    }

    // Log what was matched
    if (matchedSections.length > 0) {
        console.log('✓ Database Matches:', matchedSections.join(', '));
    } else {
        console.log('✗ No specific database matches found for this query');
    }

    return results.length > 0
        ? results.join('\n\n---\n\n')
        : 'General insurance information available. Please provide more specific details about your question.';
}

// Generate direct answer from database (bypassing LLM for better accuracy)
function generateDirectAnswer(query, dbContext) {
    const lowerQuery = query.toLowerCase();

    // Handle acknowledgments and pleasantries
    const acknowledgments = ['thanks', 'thank you', 'okay', 'ok', 'sure', 'got it', 'perfect', 'great', 'awesome'];
    if (acknowledgments.some(ack => lowerQuery === ack || lowerQuery === ack + '!' || lowerQuery === ack + '.')) {
        return "You're welcome! I'm here to help with any insurance questions you have. Feel free to ask about our policies, coverage, claims, or anything else.";
    }

    // Direct answers for common questions (with proper HTML formatting)
    const directAnswers = {
        'hit a deer': `<strong>Animal Collision Coverage</strong><br>Animal collisions like hitting a deer are covered under <strong>Comprehensive Coverage</strong>, not collision coverage.<br><strong>Filing Process:</strong><br>• File comprehensive claim within 48 hours with photos<br>• Call us immediately at 1-800-555-CLAIM<br>• Get vehicle to approved repair shop<br>• Adjuster inspects within 24 hours<br>• Repairs approved in 2-3 days<br><strong>Settlement:</strong> $2,000-$5,000 (deductible applies)`,

        'home insurance coverage': `<strong>Home Insurance Coverage Details</strong><br><strong>Property Protection:</strong><br>• Dwelling Coverage: Up to $500,000 for home structure<br>• Personal Property: Up to $250,000 for belongings<br>• Liability Coverage: Up to $300,000 for injuries on property<br>• Medical Payments: Up to $5,000 for guest injuries<br>• Additional Living Expenses: Hotel/rent if home uninhabitable<br><strong>Premium:</strong> $120-$250/month (varies by home value, location, age)`,

        'collision coverage': `<strong>Collision Coverage</strong><br>Covers vehicle damage from accidents with other cars or objects.<br><strong>Coverage Amount:</strong> Up to $50,000<br><strong>Includes:</strong><br>• Accidents with other vehicles<br>• Hitting stationary objects<br>• Single-vehicle accidents<br>• Rental car while repairs are done<br><strong>Deductible Options:</strong> $250, $500 (recommended), or $1,000<br><strong>Part of:</strong> Auto Insurance Package ($85-$150/month)`,

        'deductible for auto': `<strong>Auto Insurance Deductible Options</strong><br><strong>Available Deductibles:</strong><br>• $250 - Higher monthly premium<br>• $500 - Recommended option<br>• $1,000 - Lower monthly premium<br><strong>What is a Deductible?</strong><br>The amount you pay out-of-pocket before insurance covers the rest. Choosing a higher deductible reduces your monthly premium.<br><strong>Premium Range:</strong> $85-$150/month`,

        'car damage': `<strong>Filing a Collision Claim</strong><br><strong>Step-by-Step Process:</strong><br>1. Exchange insurance info at scene<br>2. File police report<br>3. Submit claim online or call 1-800-555-CLAIM<br>4. Get repair estimate from approved shop<br>5. Rental car will be provided<br><strong>Coverage:</strong> Collision Coverage<br><strong>Settlement Range:</strong> $3,500-$8,000<br><strong>Processing Time:</strong> Claims processed within 24 hours<br><strong>Note:</strong> Your deductible applies`,

        'policies': `<strong>Our Insurance Policies</strong><br><strong>1. Auto Insurance</strong><br>• Premium: $85-$150/month<br>• Coverage: Liability, Collision, Comprehensive<br><strong>2. Home Insurance</strong><br>• Premium: $120-$250/month<br>• Coverage: Dwelling, Personal Property, Liability<br><strong>3. Health Insurance</strong><br>• Premium: $150-$400 (individual), $500-$1,200 (family)<br>• Coverage: Preventive care, Hospital stays, Doctor visits<br><strong>4. Life Insurance</strong><br>• Premium: $25-$200/month<br>• Coverage: Term Life, Whole Life, Accidental Death`,

        'comprehensive coverage': `<strong>Comprehensive Coverage</strong><br>Protects against non-collision damage to your vehicle.<br><strong>Coverage Amount:</strong> Up to $50,000<br><strong>What's Covered:</strong><br>• Theft and vandalism<br>• Natural disasters (hail, flood, fire)<br>• Falling objects<br>• Animal collisions (hitting deer, etc.)<br>• Glass breakage<br><strong>Deductibles:</strong> $250-$1,000<br><strong>Part of:</strong> Auto Insurance Package`,

        'health insurance': `<strong>Health Insurance Coverage</strong><br><strong>Medical Coverage:</strong><br>• Preventive Care: 100% covered<br>• Hospital Stays: 80% covered after deductible<br>• Doctor Visits: $30 copay (primary), $50 (specialist)<br>• Emergency Room: $250 copay<br>• Prescription Drugs: $10 (generic), $35 (brand)<br>• Mental Health: $30 copay, unlimited visits<br><strong>Premium:</strong><br>• Individual: $150-$400/month<br>• Family: $500-$1,200/month<br><strong>Deductible Options:</strong> $500-$2,000 individual`,

        'life insurance': `<strong>Life Insurance Options</strong><br><strong>Term Life Insurance:</strong><br>• Coverage: $100,000 - $1,000,000<br>• Terms: 10, 20, or 30 years<br>• Affordable, straightforward protection<br><strong>Whole Life Insurance:</strong><br>• Permanent coverage<br>• Cash value accumulation<br>• Lifelong protection<br><strong>Additional Benefits:</strong><br>• No medical exam under $250,000<br>• Guaranteed level premiums<br>• Living benefits for terminal illness<br><strong>Premium:</strong> $25-$200/month (based on age, health, coverage)`
    };

    // Find matching direct answer
    for (const [key, answer] of Object.entries(directAnswers)) {
        if (lowerQuery.includes(key)) {
            console.log('✓ Using direct database answer (bypassing LLM for accuracy)');
            return answer;
        }
    }

    // Check if query has enough context - if too short or generic, return fallback
    if (dbContext === 'General insurance information available. Please provide more specific details about your question.') {
        console.log('✗ No relevant information found in database');
        return "I apologize, but I don't have specific information to answer your question. For detailed assistance, please [Contact Support](#) or [Connect with an Agent](#) who can help you with your specific needs.";
    }

    return null; // No direct match, will use LLM
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

        // Debug logging to verify database search
        console.log('=== DATABASE SEARCH DEBUG ===');
        console.log('User Question:', message);
        console.log('Database Context Found:', dbContext.substring(0, 200) + '...');
        console.log('Context Length:', dbContext.length, 'characters');

        // Try to get direct answer first (more reliable than LLM for known questions)
        const directAnswer = generateDirectAnswer(message, dbContext);

        // Set headers for streaming
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        if (directAnswer) {
            // Send direct answer immediately (simulating streaming for UX)
            console.log('============================\n');

            const knowMoreLink = '\n\n[Need More Information: Visit Help Center](#)';
            const fullResponse = directAnswer + knowMoreLink;

            // Simulate streaming by sending tokens in chunks
            const words = directAnswer.split(' ');
            let sentText = '';

            for (let i = 0; i < words.length; i++) {
                const word = words[i] + (i < words.length - 1 ? ' ' : '');
                sentText += word;
                res.write(`data: ${JSON.stringify({ token: word, done: false })}\n\n`);

                // Small delay for smoother streaming effect
                await new Promise(resolve => setTimeout(resolve, 20));
            }

            // Send the "Know More" link and completion
            res.write(`data: ${JSON.stringify({ token: knowMoreLink, done: true, fullResponse })}\n\n`);
            res.end();
            return;
        }

        console.log('✗ No direct match - using LLM with database context');
        console.log('============================\n');

        // Optimized prompt with data-driven responses
        const systemPrompt = `You are InsureAssist. You MUST answer using ONLY the specific data below. DO NOT use general knowledge.

AVAILABLE DATA:
${dbContext}

STRICT RULES:
1. Answer using ONLY the data above - cite specific numbers, coverage amounts, and details
2. If the data contains the answer, use those exact details
3. Keep response to 2-3 sentences maximum
4. Be professional and helpful`;
        const prompt = `${systemPrompt}\n\nCustomer Question: ${message}\n\nYour Answer (using ONLY the data above):`;

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
                temperature: 0.3,
                top_p: 0.8,
                top_k: 40,
                num_predict: 100,       // Reduced to 100 tokens (~2-3 sentences)
                num_ctx: 512
            },
            {
                timeout: 15000,
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
                        // Append "Need More Information" link to the end of response
                        const knowMoreLink = '\n\n[Need More Information: Visit Help Center](#)';
                        fullResponse += knowMoreLink;

                        // Send completion signal with full response including link
                        res.write(`data: ${JSON.stringify({ token: knowMoreLink, done: true, fullResponse })}\n\n`);
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
