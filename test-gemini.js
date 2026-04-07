import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testModel(modelName, apiKey) {
    console.log(`\n--- Testing ${modelName} ---`);
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: 'Say "Working!"' }] }],
                }),
            }
        );

        const data = await response.json();
        if (response.ok) {
            console.log(`✅ Success: ${data.candidates[0].content.parts[0].text}`);
            return true;
        } else {
            console.error(`❌ Error (${response.status}):`, data.error?.message || JSON.stringify(data));
            return false;
        }
    } catch (err) {
        console.error(`💥 Request failed for ${modelName}:`, err.message);
        return false;
    }
}

async function run() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('❌ Error: GEMINI_API_KEY not found in .env.local');
        return;
    }

    const modelsToTest = [
        'gemini-1.5-flash',
        'gemini-flash-latest',
        'gemini-2.0-flash',
        'gemini-2.0-flash-lite-preview-09-2024',
        'gemini-pro-latest'
    ];

    for (const model of modelsToTest) {
        await testModel(model, apiKey);
    }
}

run();
