require('dotenv').config();

const {
    Client,
    GatewayIntentBits
} = require('discord.js');

const {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    AudioPlayerStatus,
    NoSubscriberBehavior,
    entersState,
    VoiceConnectionStatus,
    StreamType
} = require('@discordjs/voice');

const { Readable } = require('stream');

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

let connection;

process.on('unhandledRejection', console.error);
process.on('uncaughtException', console.error);

function createSilentStream() {
    return new Readable({
        read() {
            this.push(Buffer.alloc(3840));
        }
    });
}

async function startBot() {
    try {
        const guild = client.guilds.cache.get(process.env.GUILD_ID);

        connection = joinVoiceChannel({
            channelId: process.env.CHANNEL_ID,
            guildId: process.env.GUILD_ID,
            adapterCreator: guild.voiceAdapterCreator,
            selfDeaf: false,
            selfMute: false
        });

        await entersState(
            connection,
            VoiceConnectionStatus.Ready,
            30000
        );

        console.log('Voice connected.');

        const player = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Play
            }
        });

        const resource = createAudioResource(
            createSilentStream(),
            {
                inputType: StreamType.Raw
            }
        );

        player.play(resource);

        player.on(AudioPlayerStatus.Idle, () => {
            console.log('Restarting silent audio...');

            const newResource = createAudioResource(
                createSilentStream(),
                {
                    inputType: StreamType.Raw
                }
            );

            player.play(newResource);
        });

        connection.subscribe(player);

        connection.on('stateChange', async (_, newState) => {
            console.log(`State: ${newState.status}`);

            if (
                newState.status === VoiceConnectionStatus.Disconnected ||
                newState.status === VoiceConnectionStatus.Destroyed
            ) {
                console.log('Reconnecten over 5 sec...');

                setTimeout(startBot, 5000);
            }
        });

    } catch (err) {
        console.error(err);

        setTimeout(startBot, 5000);
    }
}

client.once('ready', () => {
    console.log(`Online als ${client.user.tag}`);

    startBot();
});

client.login(process.env.TOKEN);
