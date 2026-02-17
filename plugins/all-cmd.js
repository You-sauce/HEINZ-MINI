// ========================================
// ✅ HEINZ BOT - FICHIER UNIQUE COMMANDES
// ========================================

const { cmd, commands } = require('../command');
const axios = require('axios');
const yts = require('yt-search');
const { ttdl } = require("ruhend-scraper");
const fs = require('fs');
const path = require('path');
const config = require('../config');
const isAdmin = require('../lib/isAdmin');
const { setAntideleteStatus, getAntideleteStatus } = require('../data/Antidelete');
const { setAntitag, getAntitag, removeAntitag } = require('../lib/index');
const { updateUserConfig } = require('../lib/database');

// ========================================
// 🔹 COMMON HELPERS
// ========================================

const AXIOS_DEFAULTS = {
    timeout: 60000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'application/json, text/plain, */*'
    }
};

async function tryRequest(getter, attempts = 3) {
    let lastError;
    for (let i = 1; i <= attempts; i++) {
        try { return await getter(); }
        catch (err) { lastError = err; await new Promise(r => setTimeout(r, 1000 * i)); }
    }
    throw lastError;
}

const updateConfig = async (key, value, botNumber, config, reply) => {
    try {
        config[key] = value;
        const newConfig = { ...config, [key]: value };
        await updateUserConfig(botNumber, newConfig);
        return reply(`✅ *${key}* updated to *${value}*`);
    } catch (e) {
        console.error(e);
        return reply("❌ Error saving to database.");
    }
};

// ========================================
// 🎵 TIKTOK DOWNLOAD
// ========================================

const processedMessages = new Set();

cmd({
    pattern: "tiktok",
    desc: "Télécharger une vidéo TikTok",
    category: "Downloader",
    react: "🎵"
}, async (sock, mek, m, { from, args, reply }) => {
    if (processedMessages.has(m.key.id)) return;
    processedMessages.add(m.key.id);
    setTimeout(() => processedMessages.delete(m.key.id), 5 * 60 * 1000);

    const url = args.join(" ").trim();
    if (!url) return reply("❌ Fournis un lien TikTok.");

    const tiktokRegex = /(tiktok\.com|vt\.tiktok\.com|vm\.tiktok\.com)/i;
    if (!tiktokRegex.test(url)) return reply("❌ Lien TikTok invalide.");

    await sock.sendMessage(from, { react: { text: "⏳", key: mek.key } });

    const apis = [
        `https://api.princetechn.com/api/download/tiktok?apikey=prince&url=${encodeURIComponent(url)}`,
        `https://api.princetechn.com/api/download/tiktokdlv2?apikey=prince_tech_api_azfsbshfb&url=${encodeURIComponent(url)}`,
        `https://api.dreaded.site/api/tiktok?url=${encodeURIComponent(url)}`
    ];

    try {
        let videoUrl = null, audioUrl = null, title = null;

        for (const api of apis) {
            try {
                const res = await axios.get(api, { timeout: 10000 });
                if (res.data?.result?.videoUrl) {
                    videoUrl = res.data.result.videoUrl;
                    audioUrl = res.data.result.audioUrl;
                    title = res.data.result.title;
                    break;
                } else if (res.data?.tiktok?.video) {
                    videoUrl = res.data.tiktok.video;
                    break;
                }
            } catch {}
        }

        if (!videoUrl) {
            const data = await ttdl(url);
            if (!data?.data?.length) throw "No media";
            for (const media of data.data.slice(0, 3)) {
                await sock.sendMessage(from, {
                    video: { url: media.url },
                    caption: "𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙴𝙳 𝙱𝚈 𝙷𝙴𝙸𝙽𝚉 𝙼𝙳 𝙱𝙾𝚃"
                }, { quoted: mek });
            }
            return;
        }

        const vid = await axios.get(videoUrl, { responseType: "arraybuffer" });
        await sock.sendMessage(from, {
            video: Buffer.from(vid.data),
            mimetype: "video/mp4",
            caption: title ? `𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙴𝙳 𝙱𝚈 𝙷𝙴𝙸𝙽𝚉 𝙼𝙳 𝙱𝙾𝚃\n📝 ${title}` : "𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙴𝙳 𝙱𝚈 𝙷𝙴𝙸𝙽𝚉 𝙼𝙳 𝙱𝙾𝚃"
        }, { quoted: mek });

        if (audioUrl) {
            const aud = await axios.get(audioUrl, { responseType: "arraybuffer" });
            await sock.sendMessage(from, {
                audio: Buffer.from(aud.data),
                mimetype: "audio/mp3"
            }, { quoted: mek });
        }

    } catch (e) {
        console.error(e);
        reply("❌ Échec du téléchargement TikTok.");
    }
});

// ========================================
// 🎶 YOUTUBE → MP3 (play/song)
// ========================================

async function getIzumiByUrl(url) {
    const api = `https://izumiiiiiiii.dpdns.org/downloader/youtube?url=${encodeURIComponent(url)}&format=mp3`;
    const res = await tryRequest(() => axios.get(api, AXIOS_DEFAULTS));
    return res.data.result;
}

async function getOkatsuByUrl(url) {
    const api = `https://okatsu-rolezapiiz.vercel.app/downloader/ytmp3?url=${encodeURIComponent(url)}`;
    const res = await tryRequest(() => axios.get(api, AXIOS_DEFAULTS));
    return { download: res.data.dl, title: res.data.title };
}

cmd({
    pattern: "play",
    desc: "Télécharger une musique depuis YouTube",
    category: "Music",
    react: "🎵"
}, async(sock, mek, m, { from, args, reply }) => {
    const query = args.join(" ").trim();
    if (!query) return reply("❌ Entre le nom de la musique.");
    const { videos } = await yts(query);
    if (!videos.length) return reply("❌ Aucun résultat trouvé.");
    const video = videos[0];
    const { data } = await axios.get(`https://apis-keith.vercel.app/download/dlmp3`, { params: { url: video.url } });
    if (!data?.result?.downloadUrl) throw "API failed";

    await sock.sendMessage(from, {
        audio: { url: data.result.downloadUrl },
        mimetype: "audio/mpeg",
        fileName: `${data.result.title}.mp3`,
        caption: `🎵 *${data.result.title}*\n✅ Téléchargement terminé`
    }, { quoted: mek });
});

cmd({
    pattern: "song",
    desc: "Télécharger une musique YouTube (MP3)",
    category: "Downloader",
    react: "🎶"
}, async(sock, m, message, { from, args, reply }) => {
    try {
        const text = args.join(" ").trim();
        if (!text) return reply("❌ Usage: .song <title or link>");

        let video;
        if (text.includes("youtu")) video = { url: text };
        else { const search = await yts(text); video = search.videos[0]; }

        const audio = await getIzumiByUrl(video.url).catch(() => getOkatsuByUrl(video.url));

        await sock.sendMessage(from, {
            audio: { url: audio.download },
            mimetype: "audio/mpeg",
            fileName: `${audio.title}.mp3`
        }, { quoted: m });
    } catch (e) {
        console.error(e);
        reply("❌ Impossible de télécharger la musique.");
    }
});

// ========================================
// 🖼️ AI / SeaArt / Autres générateurs
// ========================================

cmd({
    pattern: "seaart",
    desc: "Créer une image AI",
    category: "AI",
    react: "🎨"
}, async(sock, m, message, { from, args, reply }) => {
    const prompt = args.join(" ");
    if (!prompt) return reply("❌ Usage: .seaart <prompt>");
    try {
        const res = await axios.post("https://api.seaart.xyz/generate", { prompt }, AXIOS_DEFAULTS);
        await sock.sendMessage(from, { image: { url: res.data.url }, caption: `✨ Image générée pour: ${prompt}` });
    } catch (e) {
        console.error(e);
        reply("❌ Erreur lors de la génération de l'image.");
    }
});

// ========================================
// 🛠️ ADMIN / GROUPE
// ========================================

cmd({
    pattern: "antidelete",
    desc: "Activer/désactiver Anti-Delete",
    category: "Admin",
    react: "🛡️"
}, async(sock, m, message, { from, args, reply }) => {
    const status = args[0]?.toLowerCase() === "on";
    await setAntideleteStatus(from, status);
    reply(`✅ Anti-Delete ${status ? "activé" : "désactivé"}`);
});

cmd({
    pattern: "antitag",
    desc: "Activer/désactiver Anti-Tag",
    category: "Admin",
    react: "🛡️"
}, async(sock, m, message, { from, args, reply }) => {
    const option = args[0]?.toLowerCase();
    if (option === "on") await setAntitag(from, true);
    else if (option === "off") await removeAntitag(from);
    else return reply("❌ Utilisation: .antitag on/off");
    reply(`✅ Anti-Tag ${option}`);
});

// ========================================
// ⚡ PING / ALIVE
// ========================================

cmd({
    pattern: "ping",
    desc: "Vérifier si le bot est actif",
    category: "Info",
    react: "⚡"
}, async(sock, m, message, { reply }) => {
    reply("🏓 Pong! Le bot est actif ✅");
});

cmd({
    pattern: "alive",
    desc: "Vérifier si le bot est actif",
    category: "Info",
    react: "⚡"
}, async(sock, m, message, { reply }) => {
    reply("🤖 Je suis en ligne et prêt à fonctionner!");
});

// ========================================
// ✅ SETTINGS / CONFIGURATION
// ========================================

cmd({
    pattern: "set",
    desc: "Mettre à jour une configuration du bot",
    category: "Owner",
    react: "⚙️"
}, async(sock, m, message, { from, args, reply }) => {
    const key = args[0];
    const value = args[1];
    if (!key || !value) return reply("❌ Usage: .set <key> <value>");
    await updateConfig(key, value, sock.user?.id || "bot_number", config, reply);
});
