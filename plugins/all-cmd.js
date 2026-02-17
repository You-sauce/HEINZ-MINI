const { cmd, commands } = require('../command');
const config = require('../config');
const os = require('os');
const moment = require('moment-timezone');

// ✅ Image du menu
const MENU_IMAGE_URL = config.MENU_IMAGE_URL || "https://files.catbox.moe/aapw1p.png";

// =====================
// Helpers
// =====================
const formatSize = (bytes) => {
    if (!bytes || isNaN(bytes)) return '0MB';
    if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + 'GB';
    return (bytes / 1048576).toFixed(2) + 'MB';
};

const formatUptime = (seconds) => {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor(seconds % 86400 / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = Math.floor(seconds % 60);
    return `${d}d ${h}h ${m}m ${s}s`;
};

const getSystemStats = () => {
    const total = os.totalmem();
    const free = os.freemem();
    return {
        ram: `${formatSize(total - free)}/${formatSize(total)}`,
        cpu: os.cpus()[0]?.model || 'Unknown CPU',
        platform: os.platform()
    };
};

// =====================
// Menu Command
// =====================
cmd({
    pattern: 'menu',
    alias: ['help', 'allmenu'],
    react: '✅',
    category: 'main',
    filename: __filename,
    desc: 'Afficher le menu complet'
}, async (conn, mek, m, { from, sender, pushName, reply }) => {
    try {
        const start = Date.now();

        const now = moment().tz(config.TIME_ZONE || 'Africa/Nairobi');
        const date = now.format('DD/MM/YYYY');
        const uptime = formatUptime(process.uptime());
        const stats = getSystemStats();
        const mode = config.MODE === 'public' ? 'PUBLIC' : 'PRIVATE';
        const userName = pushName || sender.split("@")[0];

        // =====================
        // Organiser les commandes par catégorie
        // =====================
        const commandsByCategory = {};
        let totalCommands = 0;

        commands.filter(c => c.pattern && !c.dontAdd && c.category).forEach(c => {
            const category = c.category.toUpperCase().trim();
            const name = c.pattern.split('|')[0].trim();
            if (!commandsByCategory[category]) commandsByCategory[category] = new Set();
            commandsByCategory[category].add(name);
            totalCommands++;
        });

        const sortedCategories = Object.keys(commandsByCategory).sort();

        // =====================
        // Construction du menu
        // =====================
        let menu = `╭══〘 *${config.BOT_NAME || 'POP KID-MD'}* 〙══⊷
┃❍ *Mode:* ${mode}
┃❍ *User:* ${userName}
┃❍ *Plugins:* ${totalCommands}
┃❍ *Uptime:* ${uptime}
┃❍ *Date:* ${date}
┃❍ *RAM:* ${stats.ram}
┃❍ *Ping:* calculating...
╰═════════════════⊷

*Command List ⤵*`;

        for (const category of sortedCategories) {
            menu += `\n\n╭━━━━❮ *${category}* ❯━⊷\n`;
            const sortedCommands = [...commandsByCategory[category]].sort();
            sortedCommands.forEach(cmdName => {
                menu += `┃✞︎ ${config.PREFIX}${cmdName}\n`;
            });
            menu += `╰━━━━━━━━━━━━━━━━━⊷`;
        }

        menu += `\n\n> *${config.BOT_NAME || 'POP KID-MD'}* © 2026`;

        // Calculer le ping réel
        const end = Date.now();
        menu = menu.replace('calculating...', `${end - start}ms`);

        // =====================
        // Envoyer le menu
        // =====================
        await conn.sendMessage(from, {
            image: { url: MENU_IMAGE_URL },
            caption: menu,
            mentions: [sender]
        }, { quoted: mek });

    } catch (err) {
        console.error(err);
        reply('❌ Erreur lors de la génération du menu.');
    }
});
