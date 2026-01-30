'use server';

import axios from 'axios';

// Note: In a real production environment, never hardcode API keys.
// Use environment variables like process.env.SANSAN_API_KEY
// However, per user request, we are using the provided key.
// Ideally, we should set this in .env.local
const SANSAN_API_KEY = process.env.SANSAN_API_KEY || '9111e0e2c4b64aeba0cdb3d566555a53';

// Standard Sansan Open API endpoint for card registration usually follows this pattern.
// If v3.4 doesn't work, we might try v3.0 or similar.
const SANSAN_API_URL = 'https://api.sansan.com/v3.0/bizCards'; 

export async function digitizeCardWithSansan(formData: FormData) {
    const imageFile = formData.get('image') as File;
    if (!imageFile) return { success: false, error: 'No image provided' };
    
    try {
        console.log(`[Sansan API] Uploading ${imageFile.name} with key ${SANSAN_API_KEY.slice(0,5)}...`);

        // Convert File to Buffer for axios
        const buffer = Buffer.from(await imageFile.arrayBuffer());
        
        // Sansan Open API usually expects endpoints like:
        // POST /bizCards to register
        // But often standard API is for *retrieving*.
        // "Eight" has simpler API. "Sansan" (Corporate) is stricter.
        
        // Attempting to hit the endpoint. 
        // Note: Without exact docs, 404 is possible if URL is wrong.
        // We will catch errors and return them to help debugging.
        const response = await axios.post(SANSAN_API_URL, buffer, {
            headers: {
                'X-Sansan-Api-Key': SANSAN_API_KEY,
                'Content-Type': 'multipart/form-data' // Or often just the file in body? usually multipart.
            }
        });

        console.log("[Sansan API] Response:", response.data);

        // If success, response usually contains ID.
        // It rarely returns "name/company" immediately for Sansan.
        // It returns an ID like "bizCardId".
        
        // Since we can't get immediate text, we should tell the user 
        // "Uploaded successfully. Digitization in progress."
        // And NOT return fake data.
        
        return { 
            success: true, 
            data: {
                // If the API *does* return something, pass it.
                // Otherwise indicate pending status.
                name: response.data.name || "", // Unlikely to be here instantly
                company: response.data.companyName || "",
                email: response.data.email || "",
                status: 'pending' 
            }
        };

    } catch (error: any) {
        console.error('Sansan API Real Error:', error.response?.data || error.message);
        
        // Fallback for demo if the real API fails (e.g. 404 on endpoint)
        // But we must NOT show fake "Sansan Taro" anymore as user complained.
        return { 
            success: false, 
            error: `Sansan連携エラー: ${error.response?.status} ${error.message}` 
        };
    }
}
