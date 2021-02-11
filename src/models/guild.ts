import { getModelForClass, prop } from "@typegoose/typegoose";

export class Roles {
  @prop()
  role: string;

  @prop({ type: String })
  channels: string[];

  @prop()
  autorole: boolean;

  @prop()
  cooldownTime: number;

  constructor(
    role: string,
    channels: string[],
    autorole: boolean,
    cooldownTime: number
  ) {
    this.role = role;
    this.channels = channels;
    this.autorole = autorole;
    this.cooldownTime = cooldownTime;
  }
}

export class Guild {
  @prop()
  guildId!: string;

  @prop({ type: Roles, default: [] })
  roles?: Roles[];
}

export const GuildModel = getModelForClass(Guild);
