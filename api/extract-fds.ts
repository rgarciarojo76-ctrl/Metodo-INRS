/**
 * Vercel Serverless Function to extract FDS data using Google Gemini 1.5 Pro.
 * 
 * Payload: { text: string, fileName: string }
 * Response: { extractedData: ExtractedAgentData }
 */

export const config = {
  runtime: 'edge', // Use Edge runtime for speed and standard Web API support
};

const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;
const MODEL = 'gemini-1.5-pro-latest'; // Latest Pro model for best precision

export async function POST(request: Request) {
  if (!GEMINI_API_KEY) {
    return new Response(JSON.stringify({ error: 'Missing GOOGLE_GEMINI_API_KEY' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { text, fileName } = await request.json();

    if (!text) {
      return new Response(JSON.stringify({ error: 'Missing text content' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Construct prompt
    const prompt = `
    You are an expert industrial hygienist and chemical safety specialist.
    Analyze the following text extracted from a Safety Data Sheet (FDS/SDS) for the product "${fileName}".
    
    Extract the following technical data into a specific JSON format.
    If a field is not found, return null (or "not_found" for strings).
    Do not halluncinate. Be precise.
    
    Fields to extract:
    1. commercialName (string): The trade name of the product.
    2. substanceName (string): The chemical name if it's a pure substance, or the main hazardous component.
    3. casNumber (string): CAS registry number (format XXX-XX-X).
    4. hPhrases (string[]): List of Hazard statments codes (e.g., ["H350", "H302"]). Extract ONLY the codes.
    5. rPhrases (string[]): List of Risk phrases codes (e.g., ["R45"]). Only if H-phrases are missing (older FDS).
    6. vlaED (number): Occupational Exposure Limit - Daily (VLA-ED) in ppm or mg/m3. Prefer mg/m3.
    7. vlaEC (number): Occupational Exposure Limit - Short Term (VLA-EC).
    8. boilingPoint (number): Boiling point in °C.
    9. vaporPressure (number): Vapor pressure in kPa or mmHg (convert to kPa if possible, or just number).
    10. physicalState (string): "liquid", "solid", "gas", or "aerosol".
    11. hasFIV (boolean): True if it has a European Indicative Limit Value (VLI/IOELV).
    12. hasDermalToxicity (boolean): True if H310, H311, H312, or "Can be absorbed through skin" notation is present.
    13. solidForm (string): "polvo" (dust), "granza" (granules), etc. Only if solid.
    
    Return ONLY standard raw JSON. No markdown formatting.
    
    FDS TEXT START:
    ${text.slice(0, 30000)} 
    FDS TEXT END
    `;
    // Truncate to 30k chars to be safe, though 1.5 Pro handles much more.

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            response_mime_type: "application/json",
            temperature: 0.1, // Low temperature for factual extraction
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API Error:', errText);
      return new Response(JSON.stringify({ error: 'Gemini API failed', details: errText }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error('No content generated');
    }

    // Parse JSON
    const extracted = JSON.parse(generatedText);

    return new Response(JSON.stringify(extracted), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Extraction Error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
