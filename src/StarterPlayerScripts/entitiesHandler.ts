import { HttpService, ReplicatedStorage, TweenService } from "@rbxts/services";
import { Entity } from "ReplicatedStorage/Scripts/Entities/entity";
import { getEntityModel } from "ReplicatedStorage/Scripts/Entities/entityUtils";
import Conveyor from "ReplicatedStorage/Scripts/gridEntities/tileEntitiesChilds/conveyor";

const offset = 0.5;
const destroyConveyerEvent = ReplicatedStorage.WaitForChild("Events").WaitForChild("destroyConveyer") as RemoteEvent;

class EntitiesHandler {
    // Vector3 is in local position
    conveyers: Map<Vector3, Conveyor> = new Map<Vector3, Conveyor>();
    entitiesBaseparts: Map<Vector3, Array<BasePart | undefined>> = new Map<Vector3, Array<BasePart | undefined>>();

    gridBase: BasePart;

    constructor(gridBase: BasePart) {
        this.gridBase = gridBase;
        this.handleConveyerDestroyEvent();
    }

    private handleConveyerDestroyEvent() {
        destroyConveyerEvent.OnClientEvent.Connect((conveyer: Conveyor) => {
            this.destroyConveyer(conveyer);
        });
    }

    /**
     * @param prevTileEntity local position of the previous conveyer
     */
    updateConveyerEntities(conveyer: string) {
        const decoded = HttpService.JSONDecode(conveyer);
        const newConveyer = Conveyor.decode(decoded);
        for (let i = 0; i < newConveyer.getMaxContentSize(); i++) {
            this.moveEntity(newConveyer, i);
        }
        this.conveyers.set(newConveyer.position, newConveyer);
    }

    moveEntity(conveyer: Conveyor, i: number) {
        let oldConveyer = this.conveyers.get(conveyer.position);
        const lastIndex = conveyer.getMaxContentSize() - 1;

        // setup the oldConveyer with an empty content
        if (!oldConveyer) {
            oldConveyer = conveyer.copy();
            oldConveyer.content = new Array<Entity | undefined>(lastIndex + 1, undefined);
            this.conveyers.set(conveyer.position, oldConveyer);
            this.entitiesBaseparts.set(oldConveyer.position, new Array<BasePart | undefined>(lastIndex + 1, undefined));
        }

        if (oldConveyer) {
            let previousConveyerPos
            if (i === 0) {
                this.moveEntityToNextConveyer(conveyer, oldConveyer);
            } else if (i === lastIndex) {
                this.spawnEntity(conveyer, oldConveyer);
            } else {
                this.moveEntityInConveyer(i, conveyer, oldConveyer);
            }
        }
    }

    spawnEntity(conveyer: Conveyor, oldConveyer: Conveyor) {
        const lastIndex = conveyer.getMaxContentSize() - 1;
        const entitiesBaseparts = this.entitiesBaseparts.get(conveyer.position)
        if (!entitiesBaseparts) error("conveyerEntitiesBaseparts is undefined");
        if (oldConveyer.content[lastIndex]?.id === conveyer.content[lastIndex]?.id || !conveyer.content[lastIndex]) return;
        let entity: BasePart | undefined;

        const prevTileEntityPosition = conveyer.inputTiles[0] as unknown;

        if (!prevTileEntityPosition || !this.entitiesBaseparts.get(prevTileEntityPosition as Vector3)) {
            entity = getEntityModel(conveyer.content[lastIndex]!);
            if (!entity) error(`entity ${conveyer.content[lastIndex]!.name} is undefined`);
            entity.Orientation = new Vector3(0, conveyer.getOrientation(), 0);
            entity.Anchored = true;
            entity.Parent = this.gridBase.WaitForChild("Entities");
        } else {
            const previousEntities = this.entitiesBaseparts.get(prevTileEntityPosition as Vector3);
            if (!previousEntities) error("previousEntity is undefined");
            entity = previousEntities[0];
            previousEntities[0] = undefined
        }
        entitiesBaseparts[lastIndex] = entity;

        if (!entity) error("entity is undefined");
        const entityHeightPos = entity.Size.Y / 2;
        if (conveyer.isTurning && prevTileEntityPosition) {
            entity.Position = getEntityPositionInTurningConveyer(conveyer, prevTileEntityPosition as Vector3, this.gridBase, lastIndex + 1, entityHeightPos);
            this.lerpEntity(entity, lastIndex, conveyer, getEntityPositionInTurningConveyer(conveyer, prevTileEntityPosition as Vector3, this.gridBase, lastIndex, entityHeightPos));
        } else {
            entity.Position = getNewEntityPostion(conveyer, this.gridBase, lastIndex + 1, entityHeightPos);
            this.lerpEntity(entity, lastIndex, conveyer);
        }
    }

    moveEntityInConveyer(i: number, conveyer: Conveyor, oldConveyer: Conveyor) {
        const conveyerEntitiesBaseparts = this.entitiesBaseparts.get(conveyer.position);
        const currentBasePart: BasePart | undefined = conveyerEntitiesBaseparts ? conveyerEntitiesBaseparts[i + 1] : undefined;
        if (!conveyerEntitiesBaseparts || !currentBasePart) return;
        const prevTileEntityPosition = conveyer.inputTiles[0] as unknown;
        const shouldMove = shouldMoveEntityInConveyer(conveyer, oldConveyer, i);
        if (!shouldMove) return;

        swapArrayElements(conveyerEntitiesBaseparts, i, i + 1);

        if (conveyer.isTurning && prevTileEntityPosition) {
            this.lerpEntity(currentBasePart, i, conveyer, getEntityPositionInTurningConveyer(conveyer, prevTileEntityPosition as Vector3, this.gridBase, i, currentBasePart.Size.Y / 2));
        } else {
            this.lerpEntity(currentBasePart, i, conveyer);
        }
    }

    moveEntityToNextConveyer(conveyer: Conveyor, oldConveyer: Conveyor) {
        const conveyerEntitiesBaseparts = this.entitiesBaseparts.get(conveyer.position);
        const currentBasePart: BasePart | undefined = conveyerEntitiesBaseparts ? conveyerEntitiesBaseparts[0] : undefined;
        const nextConveyer = this.conveyers.get(conveyer.position.add(new Vector3(conveyer.direction.X, 0, conveyer.direction.Y).mul(3)));

        if (oldConveyer.content[0]?.id === conveyer.content[0]?.id) return;
        if (!conveyerEntitiesBaseparts) return;

        // destroy the entity
        if (!nextConveyer && currentBasePart) {
            currentBasePart.Destroy();
        }
        conveyerEntitiesBaseparts[0] = undefined;

        // move the entity to the next conveyer
        this.moveEntityInConveyer(0, conveyer, oldConveyer);
    }

    lerpEntity(basepart: BasePart | undefined, index: number, conveyer: Conveyor, goalPosition?: Vector3) {
        if (!basepart) error("basepart is undefined");
        const itemPerMinutes = 60 / conveyer.speed
        const goal = { Position: goalPosition ? goalPosition : getNewEntityPostion(conveyer, this.gridBase, index, basepart.Size.Y / 2) }
        const tween = TweenService.Create(basepart, new TweenInfo(itemPerMinutes, Enum.EasingStyle.Linear), goal);
        tween.Play();
    }

    destroyConveyer(conveyer: Conveyor) {
        const conveyerEntitiesBaseparts = this.entitiesBaseparts.get(conveyer.position);
        if (!conveyerEntitiesBaseparts) return;

        for (const basepart of conveyerEntitiesBaseparts) {
            if (basepart) basepart.Destroy();
        }

        this.entitiesBaseparts.delete(conveyer.position);
        this.conveyers.delete(conveyer.position);
    }
}

export default EntitiesHandler;

function swapArrayElements(array: Array<unknown | undefined>, index1: number, index2: number) {
    const temp = array[index1];
    array[index1] = array[index2];
    array[index2] = temp;
}

function getNewEntityPostion(conveyer: Conveyor, gridBase: BasePart, index: number, partHeight: number): Vector3 {
    return conveyer.getGlobalPosition(gridBase).add(new Vector3(conveyer.direction.X * offset * (3 - index), 0.15 + partHeight / 2, conveyer.direction.Y * offset * (3 - index)));
}

function getEntityPositionInTurningConveyer(conveyer: Conveyor, previousConveyerPos: Vector3, gridBase: BasePart, index: number, partHeight: number): Vector3 {
    const lastIndex = conveyer.getMaxContentSize();
    const middleIndex = math.round(conveyer.getMaxContentSize() / 2);
    const offset = 1.5 / middleIndex;
    const previousConveyerDirection = new Vector3(conveyer.position.X - previousConveyerPos.X, 0, conveyer.position.Z - previousConveyerPos.Z).Unit;
    const departPos = conveyer.getGlobalPosition(gridBase).add(previousConveyerDirection.mul(-1.5));

    if (index >= middleIndex) {
        return departPos.add(new Vector3(previousConveyerDirection.X * offset * (lastIndex - index), 0.15 + partHeight / 2, previousConveyerDirection.Z * offset * (lastIndex - index)));
    } else {
        return getNewEntityPostion(conveyer, gridBase, index, partHeight);
    }
}

function shouldMoveEntityInConveyer(conveyer: Conveyor, oldConveyer: Conveyor, i: number) {
    if (!conveyer.content[i]) return false;
    if (!oldConveyer.content || !oldConveyer.content[i]) return true;
    if (oldConveyer.content[i]?.id === conveyer.content[i]?.id) return false;

    return true;
}

