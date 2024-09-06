const { ApplicationCommandType, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonBuilder, ButtonStyle, DiscordAPIError } = require('discord.js');

module.exports = {
    name: 'search',
    description: "hola",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'query',
            description: 'wrgh',
            type: 3,
            required: true
        }
    ],
    run: async (client, interaction) => {
        await interaction.deferReply({ ephemeral: true });

        const query = interaction.options.get('query').value;
   
        if (query) {
            try {
                const response = await fetch('ejem', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ query: query })
                });

                if (!response.ok) {
                    return interaction.editReply({ content: 'No hay resultados', ephemeral: true });
                }

                const resultado = await response.json();
                let embed = {
                    title: resultado.title,
                    description: resultado.description,
                    color: client.c.main
                };
                
                await interaction.editReply({
                    content: 'Cargando las temporadas...',
                    embeds: [embed],
                    ephemeral: false
                });
                try {
                    const responseAll = await fetch('ejem', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ serieId: resultado.serieId })
                    });

                    if (!responseAll.ok) {
                        return interaction.editReply({ content: 'No hay detalles', ephemeral: true });
                    }

                    const final = await responseAll.json();

                    const formatDate = (dateString) => {
                        const date = new Date(dateString);
                        return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
                    };

                    const createSeasonMenu = () => {
                        const select = new StringSelectMenuBuilder()
                            .setCustomId('select_season')
                            .setPlaceholder('Selecciona una temporada');

                        final.seasons.forEach((season, index) => {
                            select.addOptions(
                                new StringSelectMenuOptionBuilder()
                                    .setLabel(`T${season.season}`)
                                    .setValue(index.toString())
                            );
                        });

                        return new ActionRowBuilder().addComponents(select);
                    };

                    const createEpisodeMenu = (seasonIndex) => {
                        const select = new StringSelectMenuBuilder()
                            .setCustomId('select_episode')
                            .setPlaceholder('Selecciona un episodio');

                        final.seasons[seasonIndex].episodes.forEach((episode, index) => {
                            select.addOptions(
                                new StringSelectMenuOptionBuilder()
                                    .setLabel(`E${episode.number}: ${episode.title}`)
                                    .setValue(index.toString())
                            );
                        });

                        return new ActionRowBuilder().addComponents(select);
                    };

                    const backButton = new ButtonBuilder()
                        .setCustomId('back')
                        .setLabel('Volver')
                        .setStyle(ButtonStyle.Secondary);

                    const response = await interaction.editReply({
                        content: 'temporadas y episodios disponibles',
                        embeds: [embed],
                        components: [createSeasonMenu()],
                        ephemeral: false
                    });

                    const collectorFilter = i => i.user.id === interaction.user.id;
                    const collector = response.createMessageComponentCollector({ filter: collectorFilter, time: 60000 });

                    let currentView = 'seasons';
                    let selectedSeason;

                    collector.on('collect', async i => {
                        if (i.customId === 'select_season') {
                            selectedSeason = parseInt(i.values[0]);
                            const season = final.seasons[selectedSeason];
                            
                            let updatedEmbed = {
                                title: `Temporada ${season.season}`,
                                fields: season.episodes.map(episode => ({
                                    name: `E${episode.number}: ${episode.title}`,
                                    value: formatDate(episode.air_date),
                                    inline: true
                                })),
                                color: client.c.main
                            };

                            await i.update({
                                embeds: [updatedEmbed],
                                components: [createEpisodeMenu(selectedSeason), new ActionRowBuilder().addComponents(backButton)]
                            });

                            currentView = 'episodes';
                        } else if (i.customId === 'select_episode') {
                            const episodeIndex = parseInt(i.values[0]);
                            const episode = final.seasons[selectedSeason].episodes[episodeIndex];

                            let episodeEmbed = {
                                title: `${episode.title}`,
                                description: `Temporada ${episode.season}, Episodio ${episode.number}`,
                                fields: [
                                    { name: 'Fecha de emisión', value: formatDate(episode.air_date), inline: true }
                                ],
                                image: { url: episode.image },
                                color: client.c.main
                            };

                            const watchButton = new ButtonBuilder()
                                .setCustomId(`watch_${selectedSeason}_${episodeIndex}`)
                                .setLabel('Ver')
                                .setStyle(ButtonStyle.Primary);

                            await i.update({
                                embeds: [episodeEmbed],
                                components: [
                                    new ActionRowBuilder().addComponents(backButton),
                                    new ActionRowBuilder().addComponents(watchButton)
                                ]
                            });

                            currentView = 'episode_details';
                        } else if (i.customId === 'back') {
                            if (currentView === 'episodes') {
                                await i.update({
                                    embeds: [embed],
                                    components: [createSeasonMenu()]
                                });
                                currentView = 'seasons';
                            } else if (currentView === 'episode_details') {
                                const season = final.seasons[selectedSeason];
                                let updatedEmbed = {
                                    title: `Temporada ${season.season}`,
                                    fields: season.episodes.map(episode => ({
                                        name: `E${episode.number}: ${episode.title}`,
                                        value: formatDate(episode.air_date),
                                        inline: true
                                    })),
                                    color: client.c.main
                                };

                                await i.update({
                                    embeds: [updatedEmbed],
                                    components: [createEpisodeMenu(selectedSeason), new ActionRowBuilder().addComponents(backButton)]
                                });
                                currentView = 'episodes';
                            }
                        } else if (i.customId.startsWith('watch_')) {
                            const [_, seasonIndex, episodeIndex] = i.customId.split('_');
                            const episode = final.seasons[parseInt(seasonIndex)].episodes[parseInt(episodeIndex)];

                            const gamovideoLink = episode.url.find(link => link.name === "Gamovideo");
                            if (!gamovideoLink) {
                                await i.reply({ content: 'No hay enlaces disponibles para ver esto.', ephemeral: true });
                                return;
                            }
                            
                            try {
                                const hardcodedgamo = await fetch(gamovideoLink.url, { //extrae el mp4 hardcoded en gamovideo
                                    method: 'GET',
                                    headers: {
                                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
                                    }
                                });

                                if (!hardcodedgamo.ok) {
                                    console.log("no")
                                }

                                const cont = await hardcodedgamo.text();

                                const match = cont.match(/file:\s*"([^"]+\.mp4)"/);
                                if (!match) {
                                    throw new Error('No se pudo encontrar la URL del video');
                                }

                                const videoUrl = match[1];

                                const watchResponse = await fetch('http://localhost:3000/watch', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': 'asdasd' //obviamente esto es básico
                                    },
                                    body: JSON.stringify({
                                        discordId: i.user.id,
                                        episodeurl: videoUrl,
                                        title: episode.title,
                                    })
                                });

                                if (!watchResponse.ok) {
                                    throw new Error('Error al procesar el episodio en el servidor');
                                }

                                try {
                                    const channelId = "1281597638738706454";
                                    //el canal en el que el bot invitará a ver la activity.
                                    //es innecesario en realidad, ya que con iniciar la activity cuando le das en el botón ver ya estaría, da igual la invite pero es más intuitivo

                                    const response = await fetch(`https://discord.com/api/v10/channels/${channelId}/invites`, {
                                        method: 'POST',
                                        body: JSON.stringify({
                                            max_age: 86400,
                                            max_uses: 0,
                                            target_application_id: '1108074741731954740',
                                            target_type: 2,
                                            temporary: false,
                                            validate: null
                                        }),
                                        headers: {
                                            Authorization: `Bot ${client.token}`,
                                            'Content-Type': 'application/json'
                                        }
                                    });

                                    const invite = await response.json();
                        
                                    await i.reply({
                                        content: `Empieza a ver **${episode.title}**: https://discord.com/invite/${invite.code}`,
                                        ephemeral: false
                                    });
                                } catch (error) {
                                    await i.reply({ content: "error con discord " + error, ephemeral: true });
                                }
                            } catch (error) {
                                await i.reply({ content: 'error en gamo ' + error, ephemeral: true });
                            }
                        }
                    });

                    collector.on('end', collected => {
                        interaction.editReply({ content: 'El tiempo expiró', components: [] });
                    });

                } catch (error) {
                    return interaction.editReply({ content: 'error ' + error, ephemeral: true });
                }
            } catch (error) {
                console.log(error); //idk
                return interaction.editReply({ content: 'No hay resultados', ephemeral: true });
            }
        }
    }
};