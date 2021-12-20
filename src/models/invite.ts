import { getModelForClass, prop } from "@typegoose/typegoose";

export class DbInvite {
    @prop()
    inviterId: string;

    @prop()
    guildId: string;

    @prop()
    invitedId: string;

    @prop()
    timestamp: number;

    @prop({ default: false })
    left?: Boolean;

    constructor(inviterId: string, guildId: string, invitedId: string, timestamp: number) {
        this.inviterId = inviterId;
        this.guildId = guildId;
        this.invitedId = invitedId;
        this.timestamp = timestamp;
    }
}

export const InviteModel = getModelForClass(DbInvite);