import Object from "../base";
import Vector from "../vector";

export default class PointCharge extends Object {
    charge: number;
    displayRadius: number;

    feildAt = (pos: Vector) => {
        let nVec = pos.unit();
        return 0;
    }
}