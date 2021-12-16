import { getModelForClass, prop } from "@typegoose/typegoose";

export class DbInvite {
    @prop()
    inviterId: string;

    @prop()
    invitedId: string;

    @prop()
    timestamp: number;

    @prop()
    inviteCode: string;

    @prop()
    guildId: string;
}

export const InviteModel = getModelForClass(DbInvite);