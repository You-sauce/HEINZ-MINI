const { getAntideleteStatus } = require('../data/Antidelete');
const config = require('../config');

const handleAntidelete = async (conn, updates, store) => {
    try {
        for (const update of updates) {
            if (update.key.fromMe) continue;

            const isRevoke = update.update.messageStubType === 68 || 
                             (update.update.message && 
                              update.update.message.protocolMessage && 
                              update.update.message.protocolMessage.type === 0);

            if (isRevoke) {
                const chatId = update.key.remoteJid;
                const messageId = update.key.id;
                const participant = update.key.participant || chatId;

                const isEnabled = await getAntideleteStatus(chatId);
                if (!isEnabled) return;

                if (!store || !store.messages[chatId]) return;
                const msg = await store.loadMessage(chatId, messageId);

                if (msg) {
                    const alertText = `
╭┄┄「 𝙰𝙽𝚃𝙸-𝙳𝙴𝙻𝙴𝚃𝙴 」
┆ 🚫 *𝙽𝙴𝚆 𝙼𝙴𝚂𝚂𝙰𝙶𝙴 𝙳𝙴𝙻𝙴𝚃𝙴𝙳 !*
┆ 👤 𝚄𝚂𝙴𝚁: *@${participant.split('@')[0]}*
┆ 🏷️ 𝙲𝙷𝙰𝚃 / 𝙶𝚁𝚁𝙾𝚄𝙿: *${metadata.subject || "Private Chat"}*
┆ 🕒 𝚃𝙸𝙼𝙴: *${new Date().toLocaleString()}*
┆ 𝙰𝙽𝚃𝙸 𝙳𝙴𝙻𝙴𝚃𝙴 𝙼𝙴𝚂𝚂𝙰𝙶𝙴
╰┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄◈
> *𝙷𝙴𝙸𝙽𝚉 𝙼𝙸𝙽𝙸 𝙲𝚁𝙴𝙰𝚃 𝙱𝚈 𝙷𝙴𝙸𝙽𝚉 𝚃𝙴𝙲𝙷*
`;
                    await conn.sendMessage(chatId, { text: alertText, mentions: [participant] });
                    await conn.sendMessage(chatId, { forward: msg, contextInfo: { isForwarded: false } }, { quoted: msg });
                }
            }
        }
    } catch (e) { console.error("Antidelete Error:", e); }
};

module.exports = { handleAntidelete };
