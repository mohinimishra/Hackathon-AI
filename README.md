# 🛡️ Insurance Policy Assistant Chatbot

An AI-powered interactive chatbot that helps customers understand insurance policies, file claims, and answer questions about coverage using Ollama LLM.

## Features

✅ **Policy Information** - Auto, Home, and Health insurance details  
✅ **Claims Assistant** - Helps customers understand claim types (e.g., hitting a deer, car damage)  
✅ **Dummy Data** - Pre-loaded insurance products for POC  
✅ **Context-Aware Responses** - Uses Ollama LLM with insurance database context  
✅ **Beautiful UI** - Modern, responsive HTML interface  
✅ **Real-time Chat** - Instant messaging with loading states  

## Prerequisites

- **Node.js** (v14 or higher)
- **Ollama** with llama2 model installed and running
- **macOS/Linux/Windows** terminal

## Setup Instructions

### 1. Install Ollama and llama2

```bash
# Install Ollama from https://ollama.ai
# Then pull the llama2 model
ollama pull llama2

# Run Ollama (keep this terminal open)
ollama serve
```

Ollama will run on `http://localhost:11434`

### 2. Install Backend Dependencies

```bash
cd /Users/mm/github/hackathon/backend
npm install
```

### 3. Create Environment File

```bash
cp .env.example .env
# Edit .env if needed (defaults should work fine)
```

### 4. Start the Backend Server

```bash
npm start
# Server will run on http://localhost:3000
```

### 5. Open in Browser

Open your browser and navigate to:
```
http://localhost:3000/
```

## Project Structure

```
hackathon/
├── backend/
│   ├── server.js           # Express server with Ollama integration
│   ├── package.json        # Backend dependencies
│   └── .env.example        # Environment variables template
├── frontend/
│   └── public/
│       └── index.html      # Interactive chatbot UI
└── README.md               # This file
```

## API Endpoints

### POST /api/chat
Send a message to the chatbot.

**Request:**
```json
{
  "message": "What kind of claim can I file if I hit a deer?"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Response from Ollama LLM...",
  "context": "Relevant insurance database information..."
}
```

### GET /api/health
Health check endpoint.

### GET /api/policies
Get list of available policies.

## Available Insurance Products

### Auto Insurance
- Liability Coverage: Up to $100,000
- Collision Coverage: Up to $50,000
- Comprehensive Coverage: Up to $50,000
- Uninsured Motorist Protection: Up to $100,000
- Premium: $85-$150 per month

### Home Insurance
- Dwelling Coverage: Up to $500,000
- Personal Property: Up to $250,000
- Liability Coverage: Up to $300,000
- Medical Payments: Up to $5,000
- Premium: $120-$250 per month

### Health Insurance
- Preventive Care: 100% covered
- Hospital Stays: 80% covered after deductible
- Doctor Visits: $30 copay
- Emergency Room: $250 copay
- Premium: $150-$400 per month

## Example Questions

The chatbot can answer questions like:

- "What kind of claim can I file if I hit a deer?"
- "How does collision coverage work?"
- "What does comprehensive coverage include?"
- "How do I file a home insurance claim?"
- "What are the deductible options?"
- "Tell me about your auto insurance plans"
- "What is covered under my policy?"
- "My car got damaged, how do I get that fixed?"

## Troubleshooting

### Error: "Ollama is not running"
- Make sure you've run `ollama serve` in another terminal
- Check that Ollama is accessible at `http://localhost:11434`

### Error: "Cannot connect to backend"
- Ensure backend server is running with `npm start`
- Check that no other service is using port 3000

### Model not found
- Pull the llama2 model: `ollama pull llama2`
- List available models: `ollama list`

## Customization

### Adding New Policies
Edit the `insuranceDatabase` object in `backend/server.js`:

```javascript
yourProductName: {
  name: 'Product Name',
  coverage: ['Coverage 1', 'Coverage 2'],
  deductibles: ['$500', '$1000'],
  premium: '$X-$Y per month'
}
```

### Changing LLM Model
In `backend/server.js`, change the model in the Ollama request:

```javascript
{
  model: 'mistral', // or any other available Ollama model
  prompt: prompt,
  stream: false
}
```

### Styling the UI
Edit the CSS in `frontend/public/index.html` under the `<style>` tag.

## Development Notes

- **POC Status**: Uses dummy insurance data for demonstration
- **Context-Aware**: Searches insurance database before querying LLM
- **No React**: Pure HTML/CSS/JavaScript for simplicity
- **CORS Enabled**: Frontend can make cross-origin requests
- **Timeout**: 60-second timeout for Ollama responses

## Future Enhancements

- [ ] Database integration for real policies
- [ ] User authentication
- [ ] Claim filing workflow
- [ ] PDF policy documents
- [ ] Multi-language support
- [ ] Analytics dashboard
- [ ] Integration with actual claims system

## License

MIT

## Support

For issues or questions, please check:
1. Ollama is running on http://localhost:11434
2. Backend is running on http://localhost:3000
3. Check browser console for error messages
4. Check terminal output for server logs
