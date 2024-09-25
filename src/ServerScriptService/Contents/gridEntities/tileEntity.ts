import TileGrid from "ServerScriptService/plot/gridTile";
import Entity from "../Entities/entity";
import Tile from "./tile";

const allDirections = [new Vector2(1, 0), new Vector2(0, 1), new Vector2(-1, 0), new Vector2(0, -1)]

abstract class TileEntity extends Tile {
    category: string;
    direction: Vector2;
    speed: number // the speed in object per second produced
    inputTiles: Array<TileEntity>;
    outputTiles: Array<TileEntity>;

    progression: number;

    maxInputs: number;
    maxOutputs: number;

    constructor(name: string, position: Vector3, size: Vector2, direction: Vector2, speed: number, category: string, maxInputs: number, maxOutputs: number) {
        super(name, position, size);
        this.category = category;
        this.speed = speed;
        this.direction = direction;

        this.maxInputs = maxInputs;
        this.maxOutputs = maxOutputs;
        this.inputTiles = new Array<TileEntity>(this.maxInputs);
        this.outputTiles = new Array<TileEntity>(this.maxOutputs);
        this.progression = 0;
    }

    abstract tick(dt: number): void;

    /**
     * send an entity to the next GridEntity
     * @param entities the entities to send
     * @returns the entities that could not be added to the next GridEntity
     * @example 
     * const entities = [entity1, entity2, entity3]
     * const entitiesNotAdded = addEntity(entities)
     * print(entitiesNotAdded) // [entity1, entity2, entity3]
     * // no entities were send here
     */
    abstract addEntity(entities: Array<Entity | undefined>): Array<Entity | undefined>;

    abstract updateShape(gridBase: BasePart): void;

    setInput(previousTileEntity: TileEntity): void {
        this.inputTiles.push(previousTileEntity);
    };

    setOutput(nexTileEntity: TileEntity): void {
        this.outputTiles.push(nexTileEntity);
    };

    /** Go through all connected part and try to set the input and output
     * @param touchedPart list of part touching this
     * @param gridEntities list of entities in the plot
    */
    setAllConnectedNeighboursTileEntity(tileGrid: TileGrid): void {
        for (const [neighbourTile, direction] of this.getAllNeighbours(tileGrid)) {
            if (direction === this.direction && !(this.category === "seller")) {
                this.connectOutput(neighbourTile, direction);
            } else {
                this.connectInput(neighbourTile, direction);
            }
        }
    };

    connectOutput(neighbourTile: TileEntity, direction: Vector2) {
        if (this.canConnectOutput(neighbourTile, direction) && neighbourTile.hasEnoughInput()) {
            this.outputTiles.push(neighbourTile);
            neighbourTile.setInput(this);
        }
    }

    connectInput(neighbourTile: TileEntity, direction: Vector2) {
        if (this.canConnectInput(neighbourTile, direction) && neighbourTile.hasEnoughOutput()) {
            this.inputTiles.push(neighbourTile);
            neighbourTile.setOutput(this);
            print(neighbourTile)
        }
    }

    removeConnection(tileEntity: TileEntity): void {
        this.inputTiles.remove(this.inputTiles.indexOf(tileEntity));
        this.outputTiles.remove(this.outputTiles.indexOf(tileEntity));
    }

    /**
     * @returns a map of all the neighbours of this TileEntity with the direction of from the current TileEntity to the neighbour
     */
    getAllNeighbours(tileGrid: TileGrid): Map<TileEntity, Vector2> {
        const neighbours = new Map<TileEntity, Vector2>();

        const occupiedTiles = tileGrid.getOccupiedTilesIndexes(this);
        for (const occupiedTile of occupiedTiles) {

            for (const direction of allDirections) {
                const neighbourTile = tileGrid.getTile(occupiedTile.X + direction.X, occupiedTile.Y + direction.Y);

                const isNeighbourTile = neighbourTile && neighbourTile !== this && neighbourTile instanceof TileEntity
                if (isNeighbourTile) {
                    neighbours.set(neighbourTile, new Vector2(direction.X, direction.Y));
                }
            }
        }
        return neighbours;
    }

    hasEnoughOutput(): boolean {
        return this.outputTiles.size() < this.maxOutputs;
    }

    hasEnoughInput(): boolean {
        return this.inputTiles.size() < this.maxInputs;
    }

    hasAnyOutputAndInput(): boolean {
        return this.hasEnoughOutput() && this.hasEnoughInput();
    }

    canConnectOutput(neighbourTile: TileEntity, neighbourTileDirection: Vector2): boolean {
        return neighbourTile.direction !== this.direction.mul(-1) && this.direction === neighbourTileDirection
    }

    canConnectInput(neighbourTile: TileEntity, neighbourTileDirection: Vector2): boolean {
        return neighbourTile.direction === neighbourTileDirection.mul(-1)
    }

    getOrientation(): number {
        return math.atan2(this.direction.Y, this.direction.X)
    }

    getGlobalPosition(gridBase: BasePart): Vector3 {
        return this.position.add(gridBase.Position).sub(new Vector3(0, gridBase.Size.Y / 2, 0))
    }
}

export { TileEntity };