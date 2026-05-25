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

let connection = null;

process.on('unhandledRejection', console.error);
process.on('uncaughtException', console.error);

async function connect() {
    try {
        const guild = client.guilds.cache.get(process.env.GUILD_ID);

        if (!guild) {
            console.log('Guild niet gevonden');
            return;
        }

        console.log('Joinen van voice kanaal...');

        connection = joinVoiceChannel({
            channelId: process.env.CHANNEL_ID,
            guildId: process.env.GUILD_ID,
            adapterCreator: guild.voiceAdapterCreator,
            selfDeaf: false,
            selfMute: true
        });

        connection.on('stateChange', async (oldState, newState) => {
            console.log(`Voice state: ${oldState.status} -> ${newState.status}`);

            if (
                newState.status === VoiceConnectionStatus.Disconnected ||
                newState.status === VoiceConnectionStatus.Destroyed
            ) {
                console.log('Disconnected. Reconnect over 5 sec...');

                try {
                    connection.destroy();
                } catch {}

                setTimeout(connect, 5000);
            }
        });

        await entersState(
            connection,
            VoiceConnectionStatus.Ready,
            20000
        );

        console.log('Bot succesvol verbonden.');

    } catch (err) {
        console.error('Connect error:', err);

        setTimeout(connect, 5000);
    }
}

client.once('ready', () => {
    console.log(`Online als ${client.user.tag}`);

    connect();

    setInterval(() => {
        if (!connection) {
            console.log('Geen verbinding. Reconnect...');
            connect();
        }
    }, 30000);
});

client.login(process.env.TOKEN);
