
export const config = {
    api: {
        bodyParser: {
            sizeLimit: '4mb' // allows room for image data
        }
    }
};

export default async function handler(req, res) {
    // Only accept POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { image } = req.body;
    if (!image) {
        return res.status(400).json({ error: 'No image provided' });
    }

    try {
        // Strip the base64 prefix
        const base64Data = image.replace(/^data:image\/png;base64,/, "");
        // Convert to a Buffer
        const buffer = Buffer.from(base64Data, 'base64');
        // Convert to a Blob (natively supported in Vercel's Node 18+)
        const blob = new Blob([buffer], { type: 'image/png' });

        // Build the payload for Discord
        const formData = new FormData();
        formData.append('file', blob, 'doodle.png');
        formData.append('content', '🌸 Kitti, you got a new doodle from your website!');

        // Send to your secret Webhook
        const discordResponse = await fetch(process.env.DISCORD_WEBHOOK_URL, {
            method: 'POST',
            body: formData
        });

        if (discordResponse.ok) {
            return res.status(200).json({ success: true });
        } else {
            return res.status(500).json({ error: 'Discord rejected the image' });
        }
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
}

