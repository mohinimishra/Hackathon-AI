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
- **Ollama** (with tinyllama or llama2 model installed and running)
- **macOS/Linux/Windows** terminal

## Setup Instructions

### 1. Install Ollama Locally

#### macOS
```bash
# Download and install Ollama from https://ollama.ai
# Or use Homebrew:
brew install ollama

# Start Ollama service
ollama serve
```

#### Linux
```bash
# Download installer from https://ollama.ai
# Or use curl:
curl https://ollama.ai/install.sh | sh

# Start Ollama service
ollama serve
```

#### Windows
```bash
# Download installer from https://ollama.ai and run it
# Then start Ollama from the Start Menu or command line:
ollama serve
```

### 2. Pull a Language Model

After starting Ollama, open a new terminal and pull one of these models:

```bash
# For TinyLlama (recommended - lightweight & fast, ~4GB):
ollama pull tinyllama

# OR for Llama2 (more capable but slower, ~7GB):
ollama pull llama2
```

Verify installation:
```bash
ollama list  # Shows installed models
ollama show tinyllama  # Shows model details
```

Ollama will run on `http://localhost:11434`

### 3. Install Backend Dependencies

```bash
cd backend
npm install
```

### 4. Create Environment File

```bash
cp .env.example .env
# Edit .env if needed (defaults should work fine)
# Update the model name if using a different model
```

### 5. Start the Backend Server

```bash
npm start
# Server will run on http://localhost:4000
```

### 6. Open in Browser

Open your browser and navigate to:
```
http://localhost:4000/
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

### Error: "Ollama is not running" or "Timeout"
- Make sure you've run `ollama serve` in another terminal
- Check that Ollama is accessible at `http://localhost:11434`
- Test with: `curl http://localhost:11434/api/tags`
- First request can take a few minutes as the model loads into memory

### Error: "Cannot connect to the service"
- Ensure backend server is running with `npm start`
- Check that no other service is using port 4000
- Frontend should connect to `http://localhost:4000/api/chat`

### Model loading slowly or timing out
- TinyLlama is faster and lighter - try: `ollama pull tinyllama`
- You can adjust the timeout in `backend/server.js` if needed
- First request after restarting Ollama can take several minutes

### Model not found
- List available models: `ollama list`
- Pull a model: `ollama pull tinyllama` or `ollama pull llama2`

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

### Changing the LLM Model
In `backend/server.js`, find the Ollama API call and update the model name:

```javascript
const response = await axios.post(
    OLLAMA_API,
    {
        model: 'tinyllama',  // Change this to any available Ollama model
        prompt: prompt,
        stream: false,
        temperature: 0.7,
        top_p: 0.9
    },
    { timeout: 60000 }
);
```

Available models: `tinyllama`, `llama2`, `mistral`, etc. (run `ollama list` to see installed models)

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
2. Backend is running on http://localhost:4000
3. Check browser console for error messages
4. Check terminal output for server logs
5. Test Ollama directly: `curl -X POST http://localhost:11434/api/generate -d '{"model":"tinyllama","prompt":"Hello!","stream":false}'`
