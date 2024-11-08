import { Component, Entity, EntityType } from "ReplicatedStorage/Scripts/Entities/entity";
import { TileEntity } from "../tileEntity";
import { decodeMap, decodeVector2, decodeVector3, decodeVector3Array, encodeVector2, encodeVector3 } from "ReplicatedStorage/Scripts/encoding";
import { entitiesList } from "ReplicatedStorage/Scripts/Entities/EntitiesList";

// Settings
const MAX_INPUTS = 2;
const MAX_OUTPUTS = 1;
const MAX_CAPACITY = 20;
const category: string = "assembler";

class Assembler extends TileEntity {
    currentCraft: Component | undefined;
    resource = new Map<string, number>();
    craftedComponent = 0;
    isCrafting = false;
    lastCraftingProgress = 0;
    private craftingCoroutine: thread | undefined;

    constructor(name: string, position: Vector3, size: Vector2, direction: Vector2, speed: number) {
        super(name, position, size, direction, speed, category, MAX_INPUTS, MAX_OUTPUTS);
    }

    initResources() {
        if (!this.currentCraft) return

        for (const [comp, quantity] of this.currentCraft.buildRessources) {
            this.resource.set(string.lower(comp), 0);
        }
    }

    tick(progress: number): void {
        if (this.getCraftingProgress(progress) < this.lastCraftingProgress) {
            this.craft();
        }
        if (this.getProgress(progress) < this.lastProgress) {
            if (!this.currentCraft) return;
            this.sendItemCrafted();
        };

        this.lastProgress = this.getProgress(progress);
        this.lastCraftingProgress = this.getCraftingProgress(progress);
    }

    private sendItemCrafted(): void {
        if (this.outputTiles.isEmpty()) return;

        if (this.craftedComponent === 0) return;
        this.craftedComponent--;
        this.craftedComponent += this.outputTiles[0].addEntity([table.clone(this.currentCraft!)]).size()
        return
    }

    addEntity(entities: Array<Entity>): Array<Entity> {
        if (entities.isEmpty()) return entities;
        const entity = entities[0];

        if (!entity) return entities;
        if (!this.resource || !this.resource.has(string.lower(entity.name))) return entities;

        if (this.resource.get(string.lower(entity.name))! >= MAX_CAPACITY) return entities;
        if (!this.isRessourceNeeded(entity)) return entities;

        this.resource.set(string.lower(entity.name), this.resource.get(string.lower(entity.name))! + 1);

        return new Array<Entity>();
    }

    encode(): {} {
        return {
            "name": this.name,
            "category": this.category,
            "position": encodeVector3(this.position),
            "size": encodeVector2(this.size),
            "direction": encodeVector2(this.direction),
            "speed": this.speed,
            "isCrafting": this.isCrafting,
            "currentCraft": this.currentCraft?.name,
            "resource": this.resource,
            "craftedComponent": this.craftedComponent,
            "lastProgress": this.lastProgress,
            "inputTiles": this.inputTiles.map((tile) => encodeVector3(tile.position)),
            "outputTiles": this.outputTiles.map((tile) => encodeVector3(tile.position)),
        }
    }

    static decode(decoded: unknown): Assembler {
        const data = decoded as { name: string, category: string, position: { x: number, y: number, z: number }, size: { x: number, y: number }, direction: { x: number, y: number }, speed:number, resource: Map<string, number>, isCrafting:boolean, craftedComponent: number, currentCraft: string, lastProgress: number, inputTiles: Array<{ x: number, y: number, z: number }>, outputTiles: Array<{ x: number, y: number, z: number }> };
        const crafter = new Assembler(data.name, decodeVector3(data.position), decodeVector2(data.size), decodeVector2(data.direction), data.speed);
        if (data.currentCraft) crafter.setCraft(entitiesList.get(data.currentCraft) as Component);
        crafter.resource = decodeMap(data.resource) as Map<string, number>;
        crafter.isCrafting = data.isCrafting;
        crafter.craftedComponent = data.craftedComponent;
        crafter.inputTiles = decodeVector3Array(data.inputTiles) as TileEntity[]
        crafter.outputTiles = decodeVector3Array(data.outputTiles) as TileEntity[];
        crafter.lastProgress = data.lastProgress;
        return crafter;
    }

    getNewShape(): BasePart | undefined {
        return;
    }

    public setCraft(craft: Component) {
        assert(craft.type === EntityType.MODULE, "The entity is not a module");

        this.currentCraft = craft;
        this.craftedComponent = 0;
        this.initResources();
    }

    private isRessourceNeeded(ressource: Entity): boolean {
        if (!this.currentCraft) return false;
        for (const [_resource] of this.currentCraft.buildRessources) {
            if (string.lower(ressource.name) === string.lower(_resource)) return true;
        }
        return false;
    }

    private canCraft(): boolean {
        if (this.craftingCoroutine && coroutine.status(this.craftingCoroutine) === "running") return false; // because we use this.isCrafting to send the status
        if (!this.currentCraft) return false;
        if (!this.currentCraft) return false;
        for (const [resource, quantity] of this.currentCraft.buildRessources) {
            if (this.resource.get(string.lower(resource))! < quantity) return false;
        }
        return true;
    }

    private craft() {
        if (!this.currentCraft) return;
        if (this.craftedComponent >= MAX_CAPACITY) return;
        if (!this.canCraft()) return;

        for (const [resource, quantity] of this.currentCraft.buildRessources) {
            this.resource.set(string.lower(resource), this.resource.get(string.lower(resource))! - quantity);
        }
        this.isCrafting = true;
        this.craftingCoroutine = coroutine.create(() => {
            wait(60 / this.currentCraft!.speed - 0.05);
            this.craftedComponent += this.currentCraft!.amount;
            this.isCrafting = false;
        });
        coroutine.resume(this.craftingCoroutine);
    }

    getCraftingProgress(progress: number): number {
        if (!this.currentCraft) return 0;
        return (progress * (this.currentCraft.speed / 60)) % 1;
    }
}

export default Assembler;