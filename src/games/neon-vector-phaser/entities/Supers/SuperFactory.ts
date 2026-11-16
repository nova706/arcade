import type { SuperType } from "../../data/SuperData";
import type { SuperBase } from "../Supers/SuperBase";
import { SuperBubble } from "../Supers/SuperBubble";
import { SuperNova } from "../Supers/SuperNova";
import { SuperTether } from "../Supers/SuperTether";
import { SuperTotem } from "../Supers/SuperTotem";

type Constructor = new (
    type: SuperType) => SuperBase

const REGISTRY: Record<SuperType, Constructor> = {
    bubble: SuperBubble,
    totem: SuperTotem,
    tether: SuperTether,
    nova: SuperNova,
};

export const SuperFactory = {
    create(type: SuperType): SuperBase {
        const EntityClass = REGISTRY[type];
        if (!EntityClass) throw new Error(`Super type ${type} not found`);
        return new EntityClass(type);
    }
}
