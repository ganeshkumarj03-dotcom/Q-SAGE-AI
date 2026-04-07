import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log(`Using API Key: ${apiKey.substring(0, 8)}...`);

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
            { method: 'GET' }
        );

        const data = await response.json();
        if (response.ok) {
            console.log('--- Available Models ---');
            data.models.forEach(model => {
                console.log(`- ${model.name} (v${model.version})`);
                console.log(`  Methods: ${model.supportedGenerationMethods.join(', ')}`);
            });
        } else {
            console.error(`❌ Error (${response.status}):`, JSON.stringify(data, null, 2));
        }
    } catch (err) {
        console.error(`💥 Failed to list models:`, err.message);
    }
}

listModels();
