require('dotenv').config();
const { OpenAI } = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

async function prompt(query) {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
                {role: 'system', content: 'You are a finance AI assistant.'},
                {role: 'user', content: query}
            ],
            temperature: 0.2
        });
        return response.choices[0].message.content;
    } catch (error) {
        console.error('Error fetching completion:', error);
        throw error;
    }
}

module.exports = {
    prompt
};
