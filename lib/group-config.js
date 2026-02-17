const config = require('../config');

const groupEvents = async (sock, update) => {
    try {
        const { id, participants, action } = update;
        
        // Si rien n'est activé → on sort
        if (
            config.WELCOME !== 'true' &&
            config.GOODBYE !== 'true' &&
            config.ADMINEVENTS !== 'true'
        ) return;

        let metadata;
        try {
            metadata = await sock.groupMetadata(id);
        } catch (e) {
            return;
        }

        for (const participant of participants) {
            let ppUrl;
            try {
                ppUrl = await sock.profilePictureUrl(participant, 'image');
            } catch (e) {
                ppUrl = config.IMAGE_PATH;
            }

            // -------------------------
            //  WELCOME
            // -------------------------
            if (action === 'add' && config.WELCOME === 'true') {
                const welcomeText = `
╭┄┄「 ❀ 𝚆𝙴𝙻𝙲𝙾𝙼𝙴 ❀ 」
┆ 👋 𝙷𝙴𝚈 @${participant.split('@')[0]} !
┆ 🏠 𝚆𝙴𝙻𝙲𝙾𝙼𝙴 𝚃𝙾: ${metadata.subject}
┆ 👥 𝙼𝙴𝙼𝙱𝙴𝚁𝚂: ${metadata.participants.length}
┆ 📜 𝙶𝚁𝙾𝚄𝙿 𝙳𝙴𝚂𝙲: 𝙴𝙽𝙹𝙾𝚈 𝚃𝙷𝙴 𝙶𝚁𝙾𝚄𝙿
╰┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄◈
> *𝙷𝙴𝙸𝙽𝚉 𝙼𝙸𝙽𝙸 𝙲𝚁𝙴𝙰𝚃 𝙱𝚈 𝙷𝙴𝙸𝙽𝚉 𝚃𝙴𝙲𝙷*
`;
                await sock.sendMessage(id, {
                    image: { url: ppUrl },
                    caption: welcomeText,
                    mentions: [participant]
                });
            }

            // -------------------------
            //  GOODBYE
            // -------------------------
            if (action === 'remove' && config.GOODBYE === 'true') {
                const goodbyeText = `
╭┄┄「 ✿ 𝙶𝙾𝙾𝙳𝙱𝚈𝙴 ✿ 」
┆ 👋 𝙵𝙰𝚁𝙴𝚆𝙴𝙻𝙻 @${participant.split('@')[0]}
┆ 🚪 𝙻𝙴𝙵𝚃 𝙶𝚁𝙾𝚄𝙿: ${metadata.subject}
┆ 📉 𝙼𝙴𝙼𝙱𝙴𝚁𝚂 𝚁𝙴𝙼𝙰𝙸𝙽𝙸𝙽𝙶: ${metadata.participants.length}
╰┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄◈
> *𝙷𝙴𝙸𝙽𝚉 𝙼𝙸𝙽𝙸 𝙲𝚁𝙴𝙰𝚃 𝙱𝚈 𝙷𝙴𝙸𝙽𝚉 𝚃𝙴𝙲𝙷*
`;
                await sock.sendMessage(id, {
                    image: { url: ppUrl },
                    caption: goodbyeText,
                    mentions: [participant]
                });
            }

            // -------------------------
            //  ADMIN EVENTS (Promote / Demote)
            // -------------------------
            if (config.ADMINEVENTS === 'on') {

                // PROMOTE
                if (action === 'promote') {
                    const promoteText = `
╭┄┄「 ✦ 𝙿𝚁𝙾𝙼𝙾𝚃𝙸𝙾𝙽 ✦ 」
┆ 🔥 @${participant.split('@')[0]} 𝚅𝙸𝙴𝙽𝚃 𝙳'𝙴̂𝚃𝚁𝙴 𝙿𝚁𝙾𝙼𝚄 !
┆ 👑 𝙽𝙴𝚆 𝙰𝙳𝙼𝙸𝙽: ${metadata.subject}
╰┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄◈
> *𝙷𝙴𝙸𝙽𝚉 𝙼𝙸𝙽𝙸 𝙲𝚁𝙴𝙰𝚃 𝙱𝚈 𝙷𝙴𝙸𝙽𝚉 𝚃𝙴𝙲𝙷*
`;
                    await sock.sendMessage(id, {
                        image: { url: ppUrl },
                        caption: promoteText,
                        mentions: [participant]
                    });
                }

                // DEMOTE
                if (action === 'demote') {
                    const demoteText = `
╭┄┄「 ✧ 𝙳𝙴𝙼𝙾𝚃𝙸𝙾𝙽 ✧ 」
┆ ⚠️ @${participant.split('@')[0]} 𝙳𝙴𝙼𝙾𝚃𝙴.
┆ 📉 𝙶𝚁𝙾𝚄𝙿: ${metadata.subject}
╰┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄◈
> *𝙷𝙴𝙸𝙽𝚉 𝙼𝙸𝙽𝙸 𝙲𝚁𝙴𝙰𝚃 𝙱𝚈 𝙷𝙴𝙸𝙽𝚉 𝚃𝙴𝙲𝙷*
`;
                    await sock.sendMessage(id, {
                        image: { url: ppUrl },
                        caption: demoteText,
                        mentions: [participant]
                    });
                }
            }
        }
    } catch (e) {
        console.error('❌ Error in groupEvents:', e);
    }
};

module.exports = { groupEvents };
