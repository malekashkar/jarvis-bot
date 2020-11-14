import { getModelForClass, prop } from "@typegoose/typegoose";
import { Groups } from "../commands/";

export class CodeInfo {
  @prop()
  code: string;

  @prop({ type: String })
  modules: Groups[];

  constructor(code: string, modules: Groups[]) {
    this.code = code;
    this.modules = modules;
  }
}

export default class Global {
  @prop({ default: "-" })
  prefix?: string;

  @prop({ type: CodeInfo })
  codes?: CodeInfo[];

  @prop({ default: `Default Status` })
  status?: string;

  @prop({ default: 5 })
  modulePrice?: number;
}

export const GlobalModel = getModelForClass(Global);
