import type Entity from "ReplicatedStorage/Scripts/Content/Entities/entity";
import Ressource from "ReplicatedStorage/Scripts/Content/Entities/ressource";
import { TileEntity } from "../tileEntity";
import { Iron } from "ReplicatedStorage/Scripts/Content/Entities/EntitiesList";

// Settings
const MAX_INPUTS = 0;
const MAX_OUTPUTS = 1;
const category: string = "generator";

class Generator extends TileEntity {
    ressource: Ressource | undefined;

    constructor(name: string, position: Vector3, size: Vector2, direction: Vector2, speed: number) {
        super(name, position, size, direction, speed, category, MAX_INPUTS, MAX_OUTPUTS);
        this.setRessource(Iron)
    }

    tick(progress: number): void {
        if (!this.ressource) return;

        // send the ressource if the item is not full
        if (this.getProgress(progress) < this.lastProgress) {
            if (this.outputTiles[0] !== undefined) {
                const ressourceToTransfer = new Array<Entity>(1, this.ressource.copy());
                this.outputTiles[0].addEntity(ressourceToTransfer);
            }
        }
        this.lastProgress = this.getProgress(progress);
    }

    addEntity(entities: Array<Entity>): Array<Entity> {
        return entities;
    }

    setRessource(ressource: Ressource): void {
        this.ressource = ressource;
        this.speed = ressource.speed;
    }

    updateShape(gridBase: BasePart): void {
        return;
    }
}

export default Generator;