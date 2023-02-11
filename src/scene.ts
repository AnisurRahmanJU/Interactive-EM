import Object from "./base";
import Conductor from "./charges/conductor";
import FiniteLine from "./charges/finite_line";
import InfinitePlane from "./charges/infinite_plane";
import PointCharge from "./charges/point_charge";
import Vector from "./vector";


export default class Scene {
    static parameters = {
        viewportHeight: 10,
        physicsPerSecond: 100,
        timeSpeed: 1,

    };
    objects: Object[];
    timeSpeed: number;
    width: number;
    height: number;
    physicsPerSecond: number;
    element: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    constructor(element: HTMLCanvasElement) {
        this.objects = [];
        this.element = element;
        this.context = element.getContext("2d");
        this.updateAspectRatio();
        this.render();
        this.context.textAlign = "center";
    }

    updateAspectRatio = () => {
        let aspectRatio = window.innerWidth / window.innerHeight;
        this.height = Scene.parameters.viewportHeight * 2;
        this.width = aspectRatio * this.height;
        this.element.width = window.innerWidth;
        this.element.height = window.innerHeight;
        this.context.resetTransform();
        this.context.translate(window.innerWidth / 2, window.innerHeight / 2);
        let scale = window.innerHeight / 2 / Scene.parameters.viewportHeight;
        this.context.scale(scale, scale);
    }

    render = () => {
        requestAnimationFrame(this.render);
        this.context.clearRect(0, 0, this.width, this.height);
        this.objects.forEach((object) => {
            object.render(this.context);
        });
    }
    fieldAt = (pos: Vector): Vector => {
        let out = Vector.origin();
        this.objects.forEach((object) => {
            out.add(object.fieldAt(pos));
        });
        return out;
    }

    voltageAt = (pos: Vector): number => {
        let potential = 0;
        this.objects.forEach((object) => {
            potential += object.voltageAt(pos);
        });
        return potential;
    }
    physics(dt: number) {
        this.objects.forEach((object) => {
            object.incrementPosition(dt);
        });
    }

    //Returns the force and torque between two objects. Force is measured on object a and the opposite directional force is on object b. Torque is measured for both from the midpoint of a.position and b.position. Use the parallel axis theorem to find the torque on an objects center of mass.
    forceBetween = (a: Object, b: Object): { force: Vector, torque: number } => {
        if (a instanceof PointCharge) {

        }
        return { force: Vector.origin(), torque: 0 };
    }

}

var scene: Scene;
document.addEventListener("DOMContentLoaded", () => {
    let canvas = document.getElementById("canvas") as HTMLCanvasElement;
    scene = new Scene(canvas);
    scene.objects.push(new PointCharge(1, 1, new Vector(0, 0)));
});