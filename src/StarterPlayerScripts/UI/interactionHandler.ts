import { HttpService, Players, ReplicatedStorage, RunService, UserInputService } from "@rbxts/services";
import { getTileEntityInformation } from "ReplicatedStorage/Scripts/gridEntities/tileEntityProvider";
import { decodeTile } from "ReplicatedStorage/Scripts/gridTileUtils";
import { getTileFromRay, PlacementHandler, placementType } from "ReplicatedStorage/Scripts/placementHandler";
import Generator from "ReplicatedStorage/Scripts/gridEntities/tileEntitiesChilds/generator";
import GeneratorMenu from "./generatorMenu";
import { getLocalPosition } from "ReplicatedStorage/Scripts/gridEntities/tileEntityUtils";
import Crafter from "ReplicatedStorage/Scripts/gridEntities/tileEntitiesChilds/crafter";
import CrafterMenu from "./crafterMenu";
import Assembler from "ReplicatedStorage/Scripts/gridEntities/tileEntitiesChilds/assembler";
import AssemblerMenu from "./assemblerMenu";
import { QuestBoard } from "./questsBord";
import { Hotbar } from "./hotbar";
import { DEFAULT_HOTBAR, DESTROY_MODE_KEY, ROTATE_KEY, TERMINATE_KEY } from "ReplicatedStorage/parameters";
import { isMouseInMenu, Menu } from "./menu";
import { TileGrid } from "ReplicatedStorage/Scripts/gridTile";

const getTileRemoteFunction = ReplicatedStorage.WaitForChild("Events").WaitForChild("getTile") as RemoteFunction;
const unlockedTileListEvent = ReplicatedStorage.WaitForChild("Events").WaitForChild("unlockedTileList") as RemoteEvent;
const sendTileGrid = ReplicatedStorage.WaitForChild("Events").WaitForChild("sendTileGrid") as RemoteEvent;

const hotBarKeyBinds = [Enum.KeyCode.One, Enum.KeyCode.Two, Enum.KeyCode.Three, Enum.KeyCode.Four, Enum.KeyCode.Five, Enum.KeyCode.Six, Enum.KeyCode.Seven, Enum.KeyCode.Eight, Enum.KeyCode.Nine];

const screenGui = Players.LocalPlayer!.WaitForChild("PlayerGui")!.WaitForChild("ScreenGui") as ScreenGui;

class InteractionHandler {
    private gridBase: BasePart;
    private placementHandler: PlacementHandler;

    private questBoard = new QuestBoard(Players.LocalPlayer);
    private generatorMenu = new GeneratorMenu(Players.LocalPlayer);
    private crafterMenu = new CrafterMenu(Players.LocalPlayer);
    private assemblerMenu = new AssemblerMenu(Players.LocalPlayer);
    private hotbar: Hotbar;

    private tileGrid: TileGrid | undefined;

    private lastMenu: Menu | undefined;

    constructor(gridBase: BasePart) {
        this.gridBase = gridBase;
        this.placementHandler = new PlacementHandler(gridBase);
        this.hotbar = new Hotbar(this.placementHandler);
        this.setupHotbar();

        UserInputService.InputBegan.Connect((input: InputObject, gameProcessed: boolean) => this.handleInputs(input, gameProcessed));
        RunService.Heartbeat.Connect(() => {
            this.handleInputs(undefined, false)
        })
        unlockedTileListEvent.OnClientEvent.Connect((tiles: string[]) => this.setUnlockedTiles(tiles));
        sendTileGrid.OnClientEvent.Connect((tileGrid: string) => {
            this.tileGrid = TileGrid.decode(tileGrid)
            this.placementHandler.setTileGrid(this.tileGrid);
            this.hotbar.setTileGrid(this.tileGrid);
        });
    }

    setUnlockedTiles(tiles: string[]): any {
        for (const tile of tiles) {
            this.hotbar.setSlotFromName(DEFAULT_HOTBAR.get(tile)!, tile);
        }
    }

    setupHotbar() {
        this.hotbar.setSlotFromName(0, "conveyor");
        this.hotbar.setSlotFromName(1, "generator");
        this.hotbar.setSlotFromName(2, "seller");
        this.hotbar.setSlotFromName(3, "splitter");
        this.hotbar.setSlotFromName(4, "merger");
    }

    handleInputs(input: InputObject | undefined, gameProcessed: boolean) {
        if (gameProcessed) return;
        if (!this.placementHandler) return;

        if (input && input.UserInputType === TERMINATE_KEY && this.placementHandler.placementStatus === placementType.INTERACTING) {
            this.interact();
        } else if (UserInputService.GetMouseButtonsPressed()[0] && UserInputService.GetMouseButtonsPressed()[0].UserInputType === TERMINATE_KEY) {
            if (isMouseInMenu(screenGui.FindFirstChild("hotbar") as Frame)) return;
            this.placementHandler.destroyObject();
            this.placementHandler.placeObject();
            this.hotbar.tilePlaced()
        }

        if (!input) return;
        if (input.KeyCode === ROTATE_KEY) {
            this.placementHandler.rotate();
        }
        if (input.KeyCode === DESTROY_MODE_KEY) {
            this.placementHandler.activateDestroying();
        }

        for (let i = 0; i < hotBarKeyBinds.size(); i++) {
            if (input.KeyCode === hotBarKeyBinds[i]) {
                this.hotbar.activatePlacingFromHotbar(i, this.placementHandler);
            }
        }
    }

    public interact(): void {
        if (this.lastMenu && this.lastMenu.isVisible()) {
            if (!isMouseInMenu(this.lastMenu.getMenu())) {
                this.lastMenu.hide();
                return;
            };
        }

        const tilePart = getTileFromRay(this.gridBase);
        if (!tilePart) return;

        if (this.lastMenu && this.lastMenu.tileEntity?.position === getLocalPosition(tilePart.Position, this.gridBase)) {
            this.lastMenu.show();
            return;
        }


        const partInfo = getTileEntityInformation(tilePart.Name);

        switch (partInfo.category) {
            case "generator":
                this.interarctWithGenerator(tilePart);
                break;
            case "crafter":
                this.interactWithCrafter(tilePart);
                break;
            case "assembler":
                this.interactWithAssembler(tilePart);
                break;
        }
    }

    public interactWithCrafter(crafterPart: BasePart) {
        const tile = decodeTile(HttpService.JSONDecode(getTileRemoteFunction.InvokeServer(getLocalPosition(crafterPart.Position, this.gridBase))) as Crafter);
        this.crafterMenu.setTileEntity(tile as Crafter);

        this.crafterMenu.show();
        this.lastMenu = this.crafterMenu;
    }

    public interactWithAssembler(assemblerPart: BasePart) {
        const tile = decodeTile(HttpService.JSONDecode(getTileRemoteFunction.InvokeServer(getLocalPosition(assemblerPart.Position, this.gridBase)))) as Assembler;
        this.assemblerMenu.setTileEntity(tile);

        this.assemblerMenu.show();
        this.lastMenu = this.assemblerMenu;
    }

    public interarctWithGenerator(generatorPart: BasePart): void {
        const tile = decodeTile(HttpService.JSONDecode(getTileRemoteFunction.InvokeServer(getLocalPosition(generatorPart.Position, this.gridBase))) as Generator);
        this.generatorMenu.setTileEntity(tile as Generator);

        this.generatorMenu.show();
        this.lastMenu = this.generatorMenu;
    }
}

export default InteractionHandler;