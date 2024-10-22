import { ReplicatedStorage, UserInputService, Workspace, Players } from "@rbxts/services";
import { PlacementHandler } from "ReplicatedStorage/Scripts/placementHandler";
import Hotbar from "./UI/hotbar";
import InteractionHandler from "./UI/interact";

const setPlayerPlot = ReplicatedStorage.WaitForChild("Events").WaitForChild("setPlayerPlot") as RemoteEvent;
const setConveyerBeamsEvent = ReplicatedStorage.WaitForChild("Events").WaitForChild("setConveyerBeams") as RemoteEvent;

const hotBarKeyBinds = [Enum.KeyCode.One, Enum.KeyCode.Two, Enum.KeyCode.Three, Enum.KeyCode.Four, Enum.KeyCode.Five, Enum.KeyCode.Six, Enum.KeyCode.Seven, Enum.KeyCode.Eight, Enum.KeyCode.Nine];

//Keybinds
const terminateKey = Enum.UserInputType.MouseButton1;
const rotateKey = Enum.KeyCode.R;
const destroyModeKey = Enum.KeyCode.X;
const interactionKey = Enum.KeyCode.E;

//create a new placement handler
let placementHandler: PlacementHandler;
let interaction: InteractionHandler;

const hotbar = new Hotbar();
hotbar.setSlotFromName(0, "conveyer_t1");
hotbar.setSlotFromName(1, "generator_t1");
hotbar.setSlotFromName(2, "seller");
hotbar.setSlotFromName(3, "splitter_t1");
hotbar.setSlotFromName(4, "merger_t1");
hotbar.setSlotFromName(5, "crafter");


setPlayerPlot.OnClientEvent.Connect((gridBase: BasePart) => {
    placementHandler = new PlacementHandler(gridBase);
    interaction = new InteractionHandler(gridBase);

    UserInputService.InputBegan.Connect(handleInputs);

    showPlotClaimedUI();
});

function handleInputs(input: InputObject, gameProcessed: boolean) {
    if (gameProcessed) return;

    if (input.UserInputType === terminateKey) {
        placementHandler.destroyObject();
        placementHandler.placeObject();
    }
    if (input.KeyCode === rotateKey) {
        placementHandler.rotate();
    }
    if (input.KeyCode === destroyModeKey) {
        placementHandler.activateDestroying();
    }
    if (input.KeyCode === interactionKey) {
        interaction.interact();
    }

    for (let i = 0; i < hotBarKeyBinds.size(); i++) {
        if (input.KeyCode === hotBarKeyBinds[i]) {
            hotbar.activatePlacingFromHotbar(i, placementHandler);
        }
    }
}

setConveyerBeamsEvent.OnClientEvent.Connect((beams: Array<Beam>) => {
    beams.forEach((beam) => {
        beam.SetTextureOffset();
    });
});

function showPlotClaimedUI() {
    // show a text to the player screen
    const text = ReplicatedStorage.WaitForChild("prefab").WaitForChild("UI").WaitForChild("plotClaimedUI").Clone();
    text.Parent = Players.LocalPlayer.WaitForChild("PlayerGui").WaitForChild("ScreenGui");
    wait(3);
    text.Destroy();
}
