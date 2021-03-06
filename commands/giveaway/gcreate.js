const Discord = require('discord.js')
const guildEmbedColor = new Map();
const fs = require("fs");
const ms = require("ms");
const StateManager = require('../../utils/StateManager');
const time = new Map();
const ch = new Map();
const gain = new Map();
const vc = new Map();
const winner = new Map();
const prettyMilliseconds = require('pretty-ms');
const Command = require('../../structures/Handler/Command');
const { Logger } = require('advanced-command-handler')

module.exports = class Test extends Command {
    constructor() {
        super({
            name: 'gcreate',
            description: 'Create giveaways | Creer des giveaways',
            usage: 'gcreate',
            category: 'giveaway',
            aliases: ['gstart'],
            userPermissions: ['ADMINISTRATOR'],
            clientPermissions: ['SEND_MESSAGES'],
            cooldown: 5

        });
    }

    async run(client, message, args) {


        const lang = client.lang(message.guild.lang)

        const color = message.guild.color
        const filter = (reaction, user) => ['ð', 'ð·ï¸', 'ð', 'â', 'ðµï¸'].includes(reaction.emoji.name) && user.id === message.author.id,
            dureefiltrer = response => {
                return response.author.id === message.author.id
            };
        let msg = await message.channel.send(lang.loading)
        await msg.react("ð")
        await msg.react("ð·ï¸")
        await msg.react("ðµï¸")
        await msg.react("ð")
        await msg.react("â")
        await time.set(message.guild.id, null);
        await gain.set(message.guild.id, null);
        await ch.set(message.guild.id, null);
        await vc.set(message.guild.id, '0');
        await winner.set(message.guild.id, null);
        let msgembed = new Discord.MessageEmbed()
            .setAuthor(`ð ${message.guild.name}`)
            .setColor(`${color}`)
            .setDescription(`<a:image2:789413408676118538> **INFORMATIONS:**\n\n Cliquez ð pour modifier la durÃ©e \n Cliquez ð·ï¸ pour modifier le salon \n Cliquez ðµï¸ pour modifier le nombre de gagnant   \n Cliquez ð pour modifier le gain \n Cliquez â pour lancer le giveaway\n\n<a:give:789822270641274890> **SETUP:** \n\nð  DurÃ©e **-** aucune durÃ©e dÃ©finie\nð·ï¸ Salon **-** aucun salon dÃ©finie\nðµï¸ Nombre de gagnant **-** Aucun pour le moment\nð Gain **-** aucun gain pour le moment`)

        msg.edit('', msgembed)
            .then(async m => {
                const collector = m.createReactionCollector(filter, {time: 900000});
                collector.on('collect', async r => {
                    await r.users.remove(message.author);
                    if (r.emoji.name === 'ð') {
                        message.channel.send(`ð Combien de temps doit durer le giveaway ?`).then(mp => {
                            mp.channel.awaitMessages(dureefiltrer, {max: 1, time: 30000, errors: ['time']})
                                .then(cld => {
                                    let msg = cld.first();
                                    if (!msg.content.endsWith("d") && !msg.content.endsWith("h") && !msg.content.endsWith("m") && !msg.content.endsWith("s")) return message.channel.send(`ð Temps incorrect.`)
                                    time.set(message.guild.id, ms(msg.content))
                                    message.channel.send(`ð Vous avez changÃ© le temps du prochain giveaway Ã  \`${msg.content}\``).then(() => {
                                        updateEmbed()
                                    })
                                });
                        })
                    } else if (r.emoji.name === 'ð·ï¸') {

                        message.channel.send(`ð·ï¸ Dans quel channel voulez-vous envoyer le giveaway ?`).then(mp => {
                            mp.channel.awaitMessages(dureefiltrer, {max: 1, time: 30000, errors: ['time']})
                                .then(cld => {
                                    let msg = cld.first();
                                    let channel = msg.mentions.channels.first() || msg.guild.channels.cache.get(msg.content)
                                    if (!channel) return message.channel.send(` ð·ï¸ Salon incorrect.`)
                                    message.channel.send(` ð·ï¸ Vous avez changÃ© le salon du prochain giveaway Ã  \`${channel.name}\``).then(() => {
                                        ch.set(message.guild.id, channel.id);
                                        updateEmbed()
                                    })


                                });
                        });

                    } else if (r.emoji.name === 'ðµï¸') {
                        message.channel.send(`ðµï¸ Veuillez entrer le nombre de gagnant`).then(mp => {
                            mp.channel.awaitMessages(dureefiltrer, {max: 1, time: 30000, errors: ['time']})
                                .then(cld => {
                                    let msg = cld.first();
                                    if (isNaN(msg.content)) return message.channel.send(`Vous devez entrer uniquement des chiffres.`)

                                    message.channel.send(` ðµï¸ Vous avez changÃ© le nombre de gagnants prÃ©dÃ©finis Ã  ${msg.content}`).then(() => {
                                        winner.set(message.guild.id, msg.content);
                                        updateEmbed()

                                    })


                                });
                        });

                    } else if (r.emoji.name === 'ð') {
                        message.channel.send(` ð Que voulez-vous faire gagner ?`).then(mp => {
                            mp.channel.awaitMessages(dureefiltrer, {max: 1, time: 30000, errors: ['time']})
                                .then(cld => {
                                    let msg = cld.first();
                                    gain.set(message.guild.id, msg.content)
                                    message.channel.send(`ð DÃ©sormais lors des prochains giveaway le lot a gagner seras \`${msg.content}\`.`)
                                    updateEmbed()
                                });
                        });
                    } else if (r.emoji.name === 'â') {
                        let channel = message.guild.channels.cache.get(ch.get(message.guild.id))
                        if (!channel) return message.channel.send(` <:720681441670725645:780539422479351809> \`ERREUR\` **Erreur rencontrÃ©e**: veuillez rÃ©definir le salon du giveaway.`)
                        message.channel.send(` â Giveaway lancÃ© dans ${channel}.`)
                        const gawTime = parseInt(time.get(message.guild.id));
                        client.giveaway.start(channel, {
                            time: gawTime,
                            prize: gain.get(message.guild.id),
                            winnerCount: parseInt(winner.get(message.guild.id)),
                            hostedBy: message.author,
                            messages: {
                                embedColor: `#7289da`,
                                embedColorEnd: `#7289da`,
                                giveaway: " ",
                                giveawayEmbed: " ",
                                giveawayEnded: " ",
                                timeRemaining: "\nTemps restant : \n**{duration}**",
                                inviteToParticipate: "RÃ©agis avec ð pour participer au giveaway     ",
                                winMessage: "Bien jouÃ© {winners}, tu as gagnÃ© **{prize}**",
                                embedFooter: "Giveaway time!",
                                noWinner: "DÃ©sole je n'ai pas pu dÃ©terminer un gagnant",
                                hostby: "Host par {user}",
                                winners: "gagnant(s)",
                                ededAt: "Fini Ã ",
                                units: {
                                    seconds: "secondes",
                                    minutes: "minutes",
                                    hours: "heures",
                                    days: "jours",
                                    pluralS: false
                                }
                            }
                        })

                        StateManager.emit('vc', message.guild.id, vc.get(message.guild.id))

                    }


                })

                function updateEmbed() {
                    let win = winner.get(message.guild.id);
                    let channel = ch.get(message.guild.id);
                    let voice = vc.get(message.guild.id);
                    let gains = gain.get(message.guild.id);
                    if (winner.get(message.guild.id) == null) {
                        win = 'Aucun nombre de gagnant'
                    } else if (winner.get(message.guild.id) === "false") {
                        win = 'Aucun nombre de ganant'
                    } else {
                        win = `${winner.get(message.guild.id)}`
                    }
                    if (ch.get(message.guild.id) == null) {
                        channel = 'Aucun salon dÃ©finie'
                    } else {
                        channel = `<#${ch.get(message.guild.id)}>`
                    }
                    if (vc.get(message.guild.id) === '0') {
                        voice = 'DÃ©sactivÃ©'
                    } else {
                        voice = 'ActivÃ©'
                    }
                    if (gain.get(message.guild.id) == null) {
                        gains = 'Aucun gain pour le moment'
                    }
                    msgembed = new Discord.MessageEmbed()
                    msgembed.setAuthor(`ð Lancement d'un giveaway sur ${message.guild.name}`)

                    msgembed.setColor(`${color}`)
                    msgembed.setDescription(`<a:image2:789413408676118538> **INFORMATIONS:**\n\n Cliquez ð pour modifier la durÃ©e \n Cliquez ð·ï¸ pour modifier le salon \n Cliquez ðµï¸ pour dÃ©finir le nombre de gagnant \n Cliquez ð pour modifier le gain \n Cliquez â pour lancer le giveaway\n\n<a:give:789822270641274890> **SETUP:** \n\nð  DurÃ©e **-** ${prettyMilliseconds(time.get(message.guild.id))}\nð·ï¸ Salon **-** ${channel}\n ðµï¸ Nombre de gagnants **-** ${win} \nð Gain **-** ${gains}`)

                    msg.edit(msgembed)
                }
            });
    }
}
