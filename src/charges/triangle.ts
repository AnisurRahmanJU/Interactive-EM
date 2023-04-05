import { Object, ObjectTypes } from "../base";
import Vector from "../vector";
import constants from "../constants";
import PointCharge from "./point_charge";
import Scene from "../scene";

export default class Triangle extends Object {
    private points: Vector[];
    chargeDensity: number;
    tip: Vector;
    halfWidth: number;
    constructor(properties: { [key: string]: number | Vector }) {
        super(properties);
        if (!properties.p1 || !properties.p2 || !properties.p3) throw new Error("Triangle must have 3 points in properties constructor");
        this.points = [properties.p1 as Vector, properties.p2 as Vector, properties.p3 as Vector];
        this.chargeDensity = properties.chargeDensity as number ?? 1;
        //Find lengths
        let d1 = Vector.distance(this.points[0], this.points[1]);
        let d2 = Vector.distance(this.points[1], this.points[2]);
        let d3 = Vector.distance(this.points[2], this.points[0]);
        let hypot = 2, hypot2 = 0, tip = 1;
        if (d1 >= d2 && d1 >= d3) hypot = 0, hypot2 = 1, tip = 2;
        else if (d2 >= d1 && d2 >= d3) hypot = 1, hypot2 = 2, tip = 0;
        //Find fixed triangle properties
        let hypotVec = Vector.add(this.points[hypot], Vector.multiply(this.points[hypot2], -1));
        this.halfWidth = hypotVec.magnitude() / 2;
        //Shift so that the center of mass is in the middle
        let COM = Vector.multiply(Vector.add(Vector.add(this.points[0], this.points[1]), this.points[2]), 1 / 3);
        this.position.add(COM);
        let negCOM = Vector.multiply(COM, -1);
        this.points.forEach(p => p.add(negCOM));
        //Rotate triangle so hypotenuse is horizontal
        let adjustmentRotation = Math.atan2(hypotVec.y, hypotVec.x);
        this.points.forEach(p => p.rotate(adjustmentRotation));
        if (this.points[tip].y < 0) {
            adjustmentRotation -= Math.PI;
            this.points.forEach(p => p.rotate(Math.PI));
        }
        this.rotation -= adjustmentRotation;
        this.tip = this.points[tip];
    }

    voltageAt = (pos: Vector): number => {
        const triAD = (y: number, a: number, b: number) => {
            let f = a + b / y;
            let g = (a * Math.sqrt(f * f + 1.0) - a) / f + 1.0;
            let l = Math.sqrt(a * a + 1.0);
            return y * Math.asinh(f) + b / l * Math.log(Math.abs((g + l) / (g - l)));
        }
        const triAD0 = (a: number, b: number) => {
            let l = Math.sqrt(a * a + 1.0);
            return 2.0 * b / l * Math.log(Math.abs((l - 1.0) / a));
        }
        //TODO: Make sure these are correct
        //TODO: Cache some of these calculations to improve efficiency
        //Translate so the center of the hypotenuse is at the origin
        let p = Vector.add(pos, Vector.multiply(this.position, -1));
        p.rotate(this.rotation);
        //Set position relative to center of the hypotenuse
        p.y += this.tip.y / 2;
        let halfWidth = this.halfWidth;
        let height = this.tip.y * 3 / 2;
        let ox = this.tip.x;

        //Do funky calculations

        let a1 = (this.tip.x - halfWidth) / height;
        let a2 = (this.tip.x + halfWidth) / height;
        let b1 = p.y * a1 + halfWidth - p.x;
        let b2 = p.y * a2 - halfWidth - p.x;
        if (Math.sign(p.y - height) != Math.sign(p.y)) {
            let corr = triAD0(a1, b1) - triAD0(a2, b2);
            return constants.K * this.chargeDensity * (triAD(height - p.y, a1, b1) + triAD(-p.y, a1, b1) - triAD(height - p.y, a2, b2) - triAD(-p.y, a2, b2) + corr);
        }
        else {
            return constants.K * this.chargeDensity * Math.sign(-p.y) * (triAD(height - p.y, a1, b1) - triAD(-p.y, a1, b1) - triAD(height - p.y, a2, b2) + triAD(-p.y, a2, b2));
        }
    }

    fieldAt = (pos: Vector): Vector => {
        //TODO: Field at for charged triangle
        return Vector.origin();
    }
    private distanceFromFiniteLine = (pos: Vector, p1: Vector, p2: Vector): number => {
        let len = Vector.distance(p1, p2);
        let t = Vector.dot(Vector.subtract(pos, p2), Vector.subtract(p1, p2)) / len / len;
        t = Math.max(0, Math.min(1, t));
        return Vector.distance(pos, Vector.add(p2, Vector.multiply(Vector.subtract(p1, p2), t)));
    }
    //Returns whether point is inside the triangle
    private pointInside(pos: Vector): boolean {
        //Calculate barycentric coordinates s and t
        let s = (this.points[0].x - this.points[2].x) * (pos.y - this.points[2].y) - (this.points[0].y - this.points[2].y) * (pos.x - this.points[2].x);
        let t = (this.points[1].x - this.points[0].x) * (pos.y - this.points[0].y) - (this.points[1].y - this.points[0].y) * (pos.x - this.points[0].x);
        if ((s < 0) != (t < 0) && s != 0 && t != 0)
            return false
        let d = (this.points[2].x - this.points[1].x) * (pos.y - this.points[1].y) - (this.points[2].y - this.points[1].y) * (pos.x - this.points[1].x);
        return d == 0 || (d < 0) == (s + t <= 0);

    }

    //Return the distance from the triangle
    distanceFrom = (pos: Vector): number => {
        let translatedPosition = Vector.add(pos, Vector.multiply(this.position, -1));
        translatedPosition.rotate(-this.rotation);
        if (this.pointInside(translatedPosition)) return 0;

        return Math.min(
            this.distanceFromFiniteLine(translatedPosition, this.points[0], this.points[1]),
            this.distanceFromFiniteLine(translatedPosition, this.points[1], this.points[2]),
            this.distanceFromFiniteLine(translatedPosition, this.points[2], this.points[0])
        );
    }
    getProperties = (): { [key: string]: any } => {
        return { mass: this.mass, position: this.position.copy(), rotation: this.rotation, chargeDensity: this.chargeDensity, p1: this.points[0].copy(), p2: this.points[1].copy(), p3: this.points[2].copy() };
    }
    getType = (): ObjectTypes => "triangle_charge";

    //TODO: implement moment of inertia
    momentOfInertia = (): number => Infinity;

    updateProperty = (property: string, value: number | Vector) => {
        if (property == "chargeDensity") {
            this.chargeDensity = value as number;
        }
        //If any tip positions change, recreate the object
        else if (property == "p1" || property == "p2" || property == "p3") {
            if (property == "p1") this.points[0] = value as Vector;
            if (property == "p2") this.points[1] = value as Vector;
            if (property == "p3") this.points[2] = value as Vector;
            window.Object.assign(this, this.clone());
        }
        else this.updateBaseProperty(property, value);
    }

    render = (ctx: CanvasRenderingContext2D) => {
        //Save canvas transformation
        ctx.save();
        ctx.fillStyle = Scene.getChargeColor(this.chargeDensity);
        ctx.beginPath();
        //Add on translation
        ctx.translate(this.position.x * 100, this.position.y * 100)
        //Add on rotation
        ctx.rotate(this.rotation);
        //Draw triangle path
        ctx.moveTo(this.points[0].x * 100, this.points[0].y * 100);
        ctx.lineTo(this.points[1].x * 100, this.points[1].y * 100);
        ctx.lineTo(this.points[2].x * 100, this.points[2].y * 100);
        ctx.fill();
        ctx.closePath();
        //Restore canvas transformation
        ctx.restore();
    }

    decompose = (detail: number): Object[] => {
        //Find closest trianglular number
        let triNumber = 3;
        let i = 3;
        for (; triNumber < detail; i++) triNumber += i;
        //Calculate side length
        const sideLen = i - 2;
        let charge = this.chargeDensity / triNumber;
        //Calculate vectors from 0 to 1 and 0 to 2 divided by side length
        let unit1 = Vector.multiply(Vector.subtract(this.points[1], this.points[0]), 1 / sideLen);
        let unit2 = Vector.multiply(Vector.subtract(this.points[2], this.points[0]), 1 / sideLen);
        let objs: Object[] = [];
        //Generate all points that are an integer linear combination of unit1 and unit2 and that are on the triangle
        for (let x = 0; x <= sideLen; x++) {
            for (let y = 0; y <= sideLen - x; y++) {
                objs.push(new PointCharge({
                    charge,
                    position: Vector.add(this.points[0], Vector.add(Vector.multiply(unit1, x), Vector.multiply(unit2, y)))
                }));
            }
        }
        objs.forEach(obj => obj.position.rotate(this.rotation));
        objs.forEach(obj => obj.position.add(this.position));
        return objs;
    }


}

//@ts-ignore
window.Triangle = Triangle;