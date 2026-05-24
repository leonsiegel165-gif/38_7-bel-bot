require('dotenv').config();

const {
    Client,
    GatewayIntentBits
} = require('discord.js');

const {
    joinVoiceChannel,
    entersState,
    VoiceConnectionStatus
} = require('@discordjs/voice');

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

let connection;

async function connectToVoice() {
    try {
        const guild = client.guilds.cache.get(process.env.GUILD_ID);

        if (!guild) {
            console.log('Server niet gevonden.');
            return;
        }

        connection = joinVoiceChannel({
            channelId: process.env.CHANNEL_ID,
            guildId: process.env.GUILD_ID,
            adapterCreator: guild.voiceAdapterCreator,
            selfDeaf: false,
            selfMute: true
        });

        console.log('Verbonden met voice kanaal.');

        connection.on('stateChange', async (_, newState) => {
            if (
                newState.status === VoiceConnectionStatus.Disconnected
            ) {
                console.log('Disconnected. Reconnecten...');

                setTimeout(() => {
                    connectToVoice();
                }, 5000);
            }
        });

        await entersState(
            connection,
            VoiceConnectionStatus.Ready,
            30000
        );

        console.log('Voice verbinding klaar.');

    } catch (err) {
        console.error(err);

        setTimeout(() => {
            connectToVoice();
        }, 5000);
    }
}

client.once('ready', async () => {
    console.log(`Online als ${client.user.tag}`);

    connectToVoice();
});

client.login(process.env.TOKEN);
