module.exports = {
    // ================= DATABASE =================
    MONGODB_URI: process.env.MONGODB_URI || "mongodb+srv://kaviduinduwara:kavidu2008@cluster0.bqmspdf.mongodb.net/soloBot?retryWrites=true&w=majority&appName=Cluster0",

    // ================= BOT INFO =================
    BOT_NAME: "POP KID-MD",
    OWNER_NAME: "POP KID",
    OWNER_NUMBER: "254732297194",
    PREFIX: ".",
    MODE: "public",
    PAIR_CODE: "POP-KID-1234",

    // ================= SYSTEM =================
    AUTO_REPLY: "true",
    AUTO_REACT: "true",
    AUTO_STICKER: "true",
    ALWAYS_ONLINE: "true",
    READ_MESSAGE: "true", // Active le blue tick

    // ================= SECURITY =================
    DELETE_LINKS: "true",
    ANTI_LINK: "true",
    ANTI_BAD: "true",
    ANTI_VV: "true",
    ANTI_CALL: "true", // Rejeter les appels
    REJECT_MSG: "*📞 Call rejected automatically. No calls allowed.*",

    // ================= MEDIA =================
    IMAGE_PATH: "https://files.catbox.moe/aapw1p.png", // Bienvenue / Alive image
    MENU_IMAGE_URL: "https://files.catbox.moe/aapw1p.png",
    ALIVE_IMG: "https://files.catbox.moe/aapw1p.png",

    // ================= STATUS =================
    LIVE_MSG: "> POP KID MD BOT ACTIVÉ ✅",
    DESCRIPTION: "*POP KID XTR BOT*",
    CUSTOM_REACT_EMOJIS: "💝,💖,💗,❤️",
    AUTO_STATUS_MSG: "*POP KID MD VIEWED*",
    AUTO_VIEW_STATUS: "true", // Voir automatiquement les statuts
    AUTO_LIKE_STATUS: "true", // Liker automatiquement
    AUTO_STATUS_REPLY: "false", // Réponse automatique aux statuts
    AUTO_LIKE_EMOJI: ["❤️","🌹","😇","💥","🔥","💫","💎","💙","🌝","💚"] // Liste des émojis pour liker
};
