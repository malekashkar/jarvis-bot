import { DocumentType } from "@typegoose/typegoose";
import Task, { Groups } from ".";
import { GiveawayModel } from "../models/giveaway";
import { Guild, GuildModel } from "../models/guild";

export default class GhostpingsTask extends Task {
    taskName = "ghostpings";
    interval = 5e3;

    async execute() {
        const ghostpingGuilds = GuildModel.find({ 
            $or: [ { "ghostPing.type": "HERE" }, { "ghostPing.type": "EVERYONE" } ], 
            "ghostPing.nextPing": { $lte: Date.now() }
        });

        ghostpingGuilds.on("data", async (guildData: DocumentType<Guild>) => {
            guildData.ghostPing.nextPing += guildData.ghostPing.interval;
            await guildData.save();
            
            const giveaway = await GiveawayModel.findOne({ "location.guildId": guildData.guildId });
            if(giveaway?.location?.channelId) {
                const guild = await this.client.guilds.fetch(guildData.guildId);
                if(guild) {
                    const channel = await guild.channels.fetch(giveaway.location.channelId);
                    if(channel?.type == "GUILD_TEXT") {
                        const ping = await channel.send(guildData.ghostPing.type == "HERE" ? "@here": "@everyone");
                        setTimeout(ping.delete, 1000);
                    }
                }
            }
        });
    }
}