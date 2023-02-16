import Object from "../base";
import Vector from "../vector";
import Scene from "../scene";
import constants from "../constants";

export default class FiniteLine extends Object {
    //Measured in microcoloumbs per meter
    chargeDensity: number;
    startPoint: Vector; //negative
    endPoint: Vector; //positive
    normal: Vector;
    //Measured in meters
    length: number;

    fieldAt = (pos: Vector): Vector => {
        let deltaLine = Vector.subtract(this.endPoint, this.startPoint); //The vector from one end of the line to the other
        let deltaPoint = Vector.subtract(pos, this.startPoint); //The vector from the start of the line to the point

        let pointOntoLine = Vector.scalarProject(deltaPoint, deltaLine); // the scalar projection of the point vector onto the line vector
        let pointOntoNormal = Vector.scalarProject(deltaPoint, this.normal);

        let xStart = -pointOntoLine;
        let xEnd = this.length - pointOntoLine;

        let rInvStart = 1 / Math.sqrt(Math.pow(xStart, 2) + Math.pow(pointOntoNormal, 2));
        let rInvEnd = 1 / Math.sqrt(Math.pow(xEnd, 2) + Math.pow(pointOntoNormal, 2));

        let xF = rInvEnd - rInvStart;
        let yF = (xEnd * rInvEnd - xStart * rInvStart) / pointOntoNormal;

        let fieldVec = Vector.multiply(new Vector(xF, yF), constants.K * this.chargeDensity);
        fieldVec.rotateByVector(deltaLine);

        return  fieldVec;
    }

    constructor(chargeDensity: number, mass: number, position: Vector, rotation: number, length: number) {
        super(mass, position, rotation);
        this.chargeDensity = chargeDensity;
        this.length = length;
    }

    render = (ctx: CanvasRenderingContext2D) => {
        ctx.strokeStyle = Scene.getChargeColor(this.chargeDensity);
        //Half length of the line in the direction of start
        let halfLen = Vector.multiply(new Vector(Math.cos(this.rotation), Math.sin(this.rotation)), this.length / 2);
        let start = Vector.add(this.position, halfLen);
        let end = Vector.add(this.position, Vector.multiply(halfLen, -1));
        //Non linear thickness
        ctx.lineWidth = Math.abs(this.chargeDensity) * 25 / (Math.abs(this.chargeDensity) + 3);
        //Path from start to end
        ctx.beginPath();
        ctx.moveTo(start.x * 100, start.y * 100);
        ctx.lineTo(end.x * 100, end.y * 100);
        ctx.stroke();
        ctx.closePath();

    }
}
