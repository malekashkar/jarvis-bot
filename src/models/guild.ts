import { getModelForClass, prop } from "@typegoose/typegoose";

export class Roles {    
  @prop()
  role: string;

  @prop()
  channels: string[];

  @prop()
  autorole: boolean;

  @prop()
  cooldownTime: number;
}

export class Time {
  @prop()
  user: string;

  @prop()
  channel: string;

  @prop()
  time: number;
}

export class Guild {
  @prop()
  guildId!: string;

  @prop()
  roleMessage?: string;

  @prop({ type: Roles, default: [] })
  roles?: Roles[];

  @prop({ type: String, default: [] })
  auth?: string[];

  @prop({ type: Time, default: [] })
  time?: Time[];
}

export const GuildModel = getModelForClass(Guild);
