import { getModelForClass, prop } from "@typegoose/typegoose";
import { ModulePrices } from "./global";

export type Groups = keyof ModulePrices;

export class Reminder {
  @prop({ required: true })
  id: number;

  @prop({ required: true })
  guildId: string;

  @prop({ required: true })
  name: string;

  @prop({ required: true })
  message: string;

  constructor(id: number, guildId: string, name: string, message: string) {
    this.id = id;
    this.guildId = guildId;
    this.name = name;
    this.message = message;
  }
}

export class LastAd {
  @prop()
  channel: string;

  @prop()
  nextAdTime: number;
}

export default class User {
  @prop()
  userId!: string;

  @prop()
  access?: boolean;

  @prop({ type: String })
  modules?: Groups[];

  @prop()
  usedCode?: string;

  @prop({ type: Reminder })
  reminders?: Reminder[];

  @prop()
  lastAd?: LastAd;
}

export const UserModel = getModelForClass(User);
