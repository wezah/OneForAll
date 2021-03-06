const Event = require('../../structures/Handler/Event');
const {Logger} = require("advanced-command-handler");

module.exports = class roleCreate extends Event {
    constructor() {
        super({
            name: 'roleCreate',
        });
    }

    async run(client, role) {
        if(role.managed) return;
        let guild = role.guild;
        if (!guild.me.hasPermission("VIEW_AUDIT_LOG")) return;
        const color = guild.color
        let {antiraidLog} = guild.logs;
        let {logs} = client.lang(guild.lang)


        const antiraidConfig = guild.antiraid;
        const isOn = antiraidConfig.enable[this.name];
        if (!isOn) return;
        let action = await guild.fetchAuditLogs({type: "ROLE_CREATE"}).then(async (audit) => audit.entries.first());

        if (action.executor.id === client.user.id) return Logger.log(`No sanction oneforall`, `${this.name}`, 'pink');
        if (guild.ownerID === action.executor.id) return Logger.log(`No sanction crown`, `${this.name}`, 'pink');

        let isGuildOwner = guild.isGuildOwner(action.executor.id);
        let isBotOwner = client.isOwner(action.executor.id);

        let isWlBypass = antiraidConfig.bypass[this.name];
        if (isWlBypass) var isWl = guild.isGuildWl(action.executor.id);
        if (isGuildOwner || isBotOwner || isWlBypass && isWl) return Logger.log(`No sanction  ${isWlBypass && isWl ? `whitelisted` : `guild owner list or bot owner`}`, `ROLE_CREATEE`, 'pink');
        if (isWlBypass && !isWl || !isWlBypass) {
            const member = guild.members.cache.get(action.executor.id) || await guild.members.fetch(action.executor.id)
            const channel = guild.channels.cache.get(antiraidLog)
            try {
                role.delete(`OneForall - Type : roleCreate`);

            } catch (e) {
                if (e.toString().toLowerCase().includes('missing permissions')) {

                    if(channel){
                        channel.send(logs.roleCreate(member, role.name, role.id,color, "Je n'ai pas assé de permissions"))
                    }


                }
            }

            let sanction = antiraidConfig.config[this.name];

            if (member.roles.highest.comparePositionTo(role.guild.me.roles.highest) <= 0) {

                if (sanction === 'ban') {
                    await guild.members.ban(action.executor.id, {reason: "OneForAll - Type : roleCreate"})
                } else if (sanction === 'kick') {
                    member.kick(
                        `OneForAll - Type: roleCreate `
                    )
                } else if (sanction === 'unrank') {
                    let roles = []
                  await member.roles.cache
                        .map(role => roles.push(role.id))

                    await member.roles.remove(roles, `OneForAll - Type: roleCreate`)
                    if (action.executor.bot) {
                        let botRole = member.roles.cache.filter(r => r.managed)

                        for (const [id] of botRole) {
                            botRole = guild.roles.cache.get(id)
                        }
                        await botRole.setPermissions(0, `OneForAll - Type: roleCreate`)
                    }
                }
               if(channel){
                   channel.send(logs.roleCreate(member, role.name, role.id, color, sanction))
               }
            } else {

                if(channel){
                    channel.send(logs.roleCreate(member, role.name,role.id, color, "Je n'ai pas assé de permissions"))
                }
            }
        }
    }
}
