import type Entity from "ReplicatedStorage/Scripts/Content/Entities/entity";
import Resource from "ReplicatedStorage/Scripts/Content/Entities/resource";
import { TileEntity } from "../tileEntity";
import { decodeVector2, decodeVector3, decodeVector3Array, encodeVector2, encodeVector3 } from "ReplicatedStorage/Scripts/encoding";

// Settings
const MAX_INPUTS = 0;
const MAX_OUTPUTS = 1;
const category: string = "generator";

class Generator extends TileEntity {
    ressource: Resource | undefined;

    constructor(name: string, position: Vector3, size: Vector2, direction: Vector2, speed: number) {
        super(name, position, size, direction, speed, category, MAX_INPUTS, MAX_OUTPUTS);
    }

    tick(progress: number): void {
        if (!this.ressource) return;

        // send the ressource if the item is not full
        if (this.getProgress(progress) < this.lastProgress) {
            if (this.outputTiles[0]) {
                const ressourceToTransfer = [this.ressource.copy()];
                this.outputTiles[0].addEntity(ressourceToTransfer);
            }
        }
        this.lastProgress = this.getProgress(progress);
    }

    addEntity(entities: Array<Entity>): Array<Entity> {
        return entities;
    }

    setRessource(ressource: Resource): void {
        this.ressource = ressource;
        this.ressource.id = 0;
        this.speed = ressource.speed;
    }

    updateShape(gridBase: BasePart): void {
        return;
    }

    getNewShape(): BasePart | undefined {
        return;
    }

    public encode(): {} {
        return {
            "name": this.name,
            "category": this.category,
            "position": encodeVector3(this.position),
            "size": encodeVector2(this.size),
            "direction": encodeVector2(this.direction),
            "ressource": this.ressource?.name,
            "lastProgress": this.lastProgress,
            "outputTiles": this.outputTiles.map((tile) => encodeVector3(tile.position)),
        }
    }

    static decode(decoded: unknown): Generator {
        const data = decoded as { name: string, category: string, position: { x: number, y: number, z: number }, size: { x: number, y: number }, direction: { x: number, y: number }, ressource: string, lastProgress: number, outputTiles: Array<{ x: number, y: number, z: number }> }
        const generator = new Generator(data.name, decodeVector3(data.position), decodeVector2(data.size), decodeVector2(data.direction), 1);
        generator.lastProgress = data.lastProgress;
        if (data.ressource) generator.setRessource(new Resource(data.ressource));
        generator.outputTiles = decodeVector3Array(data.outputTiles) as Array<TileEntity>;
        return generator;
    }
}

export default Generator;