import { Component, Entity, EntityType } from "ReplicatedStorage/Scripts/Entities/entity";
import { TileEntity } from "../tileEntity";
import { decodeVector2, decodeVector3, decodeVector3Array, encodeVector2, encodeVector3 } from "ReplicatedStorage/Scripts/encoding";
import { GRID_SIZE } from "ReplicatedStorage/parameters";
import { entitiesList } from "ReplicatedStorage/Scripts/Entities/EntitiesList";

// Settings
const MAX_INPUTS = 1;
const MAX_OUTPUTS = 1;
const MAX_CAPACITY = 20;
const category: string = "crafter";

class Crafter extends TileEntity {
    // mettre type component
    currentCraft: Component | undefined;
    resource = 0;
    craftedComponent = 0;

    constructor(name: string, position: Vector3, size: Vector2, direction: Vector2, speed: number) {
        super(name, position, size, direction, 0, category, MAX_INPUTS, MAX_OUTPUTS);
    }

    tick(progress: number): void {
        if (this.getProgress(progress) < this.lastProgress) {
            if (!this.currentCraft) return;
            this.sendItemCrafted();
        };

        this.lastProgress = this.getProgress(progress);
    }

    private sendItemCrafted(): void {
        const craftedComponent = this.craft();
        if (this.outputTiles.isEmpty()) return;

        if (!craftedComponent) {
            if (this.craftedComponent === 0) return;
            this.craftedComponent--;
            this.craftedComponent += this.outputTiles[0].addEntity([table.clone(this.currentCraft!)]).size()
            return
        };

        const hasComponentBeenSend = this.outputTiles[0].addEntity([craftedComponent]).isEmpty();
        if (hasComponentBeenSend) this.craftedComponent--;
    }

    addEntity(entities: Array<Entity>): Array<Entity> {
        if (entities.isEmpty()) return entities;
        if (this.resource >= MAX_CAPACITY) return entities;

        const entity = entities[0];
        if (!this.isRessourceNeeded(entity)) return entities;

        this.resource++;

        return new Array<Entity>();
    }

    encode(): {} {
        return {
            "name": this.name,
            "category": this.category,
            "position": encodeVector3(this.position),
            "size": encodeVector2(this.size),
            "direction": encodeVector2(this.direction),
            "currentCraft": this.currentCraft?.name,
            "resource": this.resource,
            "craftedComponent": this.craftedComponent,
            "lastProgress": this.lastProgress,
            "inputTiles": this.inputTiles.map((tile) => encodeVector3(tile.position)),
            "outputTiles": this.outputTiles.map((tile) => encodeVector3(tile.position)),
        }
    }

    static decode(decoded: unknown): Crafter {
        const data = decoded as { name: string, category: string, position: { x: number, y: number, z: number }, size: { x: number, y: number }, direction: { x: number, y: number }, resource: number, craftedComponent: number, currentCraft: string, lastProgress: number, inputTiles: Array<{ x: number, y: number, z: number }>, outputTiles: Array<{ x: number, y: number, z: number }> };
        const crafter = new Crafter(data.name, decodeVector3(data.position), decodeVector2(data.size), decodeVector2(data.direction), 1);
        if (data.currentCraft) crafter.setCraft(entitiesList.get(data.currentCraft) as Component);
        crafter.resource = data.resource;
        crafter.craftedComponent = data.craftedComponent;
        crafter.inputTiles = decodeVector3Array(data.inputTiles) as TileEntity[]
        crafter.outputTiles = decodeVector3Array(data.outputTiles) as TileEntity[];
        crafter.lastProgress = data.lastProgress;
        return crafter;
    }

    rotate(gridBase: BasePart): void {
        this.size = new Vector2(this.size.Y, this.size.X);
        this.direction = new Vector2(-this.direction.Y, this.direction.X);

        const currentPart = this.findThisPartInWorld(gridBase);
        const offestPosition = new Vector3(-GRID_SIZE / 2, 0, GRID_SIZE / 2)
        const isUp = (this.getOrientation() + 90) % 180 === 0

        this.position = isUp ? this.position.sub(offestPosition) : this.position.add(offestPosition);
        currentPart!.Position = this.getGlobalPosition(gridBase);
    }

    getNewShape(): BasePart | undefined {
        return;
    }

    public setCraft(craft: Component) {
        assert(craft.type === EntityType.COMPONENT, "The entity is not a component");

        this.currentCraft = craft;
        this.speed = craft.speed
        this.craftedComponent = 0;
        this.resource = 0;
    }

    private isRessourceNeeded(ressource: Entity): boolean {
        if (!this.currentCraft) return false;
        for (const [_resource] of this.currentCraft.buildRessources) {
            if (string.lower(ressource.name) === string.lower(_resource)) return true;
        }
        return false;
    }

    private canCraft(): boolean {
        if (!this.currentCraft) return false;
        const [ressource] = this.currentCraft.buildRessources
        return this.resource >= ressource[1]
    }

    private craft(): Component | undefined {
        if (!this.currentCraft) return;
        if (this.craftedComponent >= MAX_CAPACITY) return;
        if (!this.canCraft()) return;
        const [resource] = this.currentCraft.buildRessources
        this.resource -= resource[1];
        this.craftedComponent++;
        return table.clone(this.currentCraft);
    }
}

export default Crafter;