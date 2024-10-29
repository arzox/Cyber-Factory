import { InteractionMenu } from "./InteractionMenu";
import Crafter from "ReplicatedStorage/Scripts/gridEntities/tileEntitiesChilds/crafter";
import { HttpService, ReplicatedStorage, RunService, TweenService } from "@rbxts/services";
import { decodeTile } from "ReplicatedStorage/Scripts/gridTileUtils";
import { getImage } from "./imageUtils";
import { entitiesList } from "ReplicatedStorage/Scripts/Entities/EntitiesList";
import { Component, EntityType } from "ReplicatedStorage/Scripts/Entities/entity";

const changeCrafterOrAssemblerCraft = ReplicatedStorage.WaitForChild("Events").WaitForChild("changeCrafterOrAssemblerCraft") as RemoteEvent;
const getTileRemoteFunction = ReplicatedStorage.WaitForChild("Events").WaitForChild("getTile") as RemoteFunction;

class CrafterMenu implements InteractionMenu {
    player: Player;
    tileEntity: Crafter | undefined;
    menu: crafterMenu;
    private timeCrafterAdded: number | undefined;

    private barTween: Tween | undefined;

    constructor(player: Player) {
        this.player = player;
        this.menu = player.WaitForChild("PlayerGui")!.WaitForChild("ScreenGui")!.WaitForChild("crafterMenu") as crafterMenu;
    }

    setTileEntity(crafter: Crafter): void {
        if (this.tileEntity?.position === crafter.position && this.tileEntity.currentCraft?.name === crafter.currentCraft?.name) return;
        this.tileEntity = crafter;

        this.timeCrafterAdded = tick();
        this.setupMenu();
    }

    public setupMenu(): void {
        if (!this.tileEntity) return;
        this.loadCraftList();

        if (this.tileEntity.currentCraft) {
            (this.menu.searchCraft.FindFirstChild(this.tileEntity.currentCraft.name) as TextButton)!.BorderSizePixel = 4;
            this.setupCraft(this.tileEntity.currentCraft);
            this.setupProgressBar();
        }

        this.setupClose();

        if (!this.tileEntity.currentCraft) { this.menu.craft.Visible = false; return; }
    }

    setupClose() {
        this.menu.toptop.close.MouseButton1Click.Connect(() => {
            this.hide();
        })
    }

    loadCraftList() {
        const componentPrefab = ReplicatedStorage.FindFirstChild("prefab")?.FindFirstChild("UI")?.FindFirstChild("component") as TextButton;
        for (const child of this.menu.searchCraft.GetChildren()) {
            if (child.IsA("TextButton")) child.Destroy();
        }

        const components = entitiesList
        for (const [componentName, component] of components) {
            if (component.type !== EntityType.COMPONENT) continue;
            
            const newComponent = componentPrefab.Clone();
            newComponent.Name = componentName;
            (newComponent.FindFirstChild("itemName")! as TextLabel).Text = componentName;
            (newComponent.FindFirstChild("itemImage")! as ImageLabel).Image = getImage(component);
            (newComponent.FindFirstChild("price")!.FindFirstChild("price")! as TextLabel).Text = tostring(component.price);
            newComponent.Parent = this.menu.searchCraft;

            newComponent.MouseButton1Click.Connect(() => {
                if (!this.tileEntity) return;
                if (this.tileEntity.currentCraft && this.tileEntity.currentCraft.name === componentName) return;

                this.setupCurrentComponent(entitiesList.get(componentName) as Component);
            });
        }
    }

    setupCurrentComponent(component: Component): void {
        this.menu.craft.Visible = true;
        this.removeBorder();
        (this.menu.searchCraft.FindFirstChild(component.name) as TextButton)!.BorderSizePixel = 4;

        this.setupCraft(component);

        changeCrafterOrAssemblerCraft.FireServer(this.tileEntity!.position, component.name);
        while (this.tileEntity?.currentCraft?.name !== component.name) {
            this.tileEntity = decodeTile(HttpService.JSONDecode(getTileRemoteFunction.InvokeServer(this.tileEntity!.position))) as Crafter;
            wait(0.1);
        }
        this.timeCrafterAdded = tick();

        this.setupProgressBar();
    }

    setupCraft(component: Component): void {
        const [compBuildRessource] = component.buildRessources;
        const componentInImg = entitiesList.get(compBuildRessource[0]);

        this.menu.craft.itemName.Text = component.name;
        this.menu.craft.itemName.price.TextLabel.Text = component.price as unknown as string;
        this.menu.craft.progression["3itemOut"].Image = getImage(component);
        this.menu.craft.progression["1itemIn"].Image = getImage(componentInImg);
        this.menu.craft.speed.Text = component.speed + "/s";
    }

    removeBorder() {
        for (const child of this.menu.searchCraft.GetChildren()) {
            if (!child.IsA("TextButton")) continue;
            child.BorderSizePixel = 0;
        }
    }

    private setupProgressBar(): void {
        const progression = this.menu.craft.progression;
        const timeToFill = 60 / this.tileEntity!.speed;
        const calculatedProgression = this.tileEntity!.lastProgress + ((tick() - this.timeCrafterAdded!) % timeToFill) / timeToFill

        const barTweenInfo = new TweenInfo(timeToFill * (1 - calculatedProgression), Enum.EasingStyle.Linear, Enum.EasingDirection.InOut);
        progression["2progressionBar"].bar.Size = new UDim2(calculatedProgression, 0, 1, 0);
        const tween = TweenService.Create(progression["2progressionBar"].bar, barTweenInfo, { Size: new UDim2(1, 0, 1, 0) });
        tween.Play();

        tween.Completed.Connect(() => {
            progression["2progressionBar"].bar.Size = new UDim2(0, 0, 1, 0);
            const barTweenInfo = new TweenInfo(timeToFill, Enum.EasingStyle.Linear, Enum.EasingDirection.InOut, -1);
            this.barTween = TweenService.Create(progression["2progressionBar"].bar, barTweenInfo, { Size: new UDim2(1, 0, 1, 0) });
            this.barTween.Play();
        });
    }

    public show(): void {
        this.menu.Visible = true;
        RunService.BindToRenderStep("crafterMenu", 1, () => {
            if (!this.tileEntity) return;
            this.tileEntity = Crafter.decode(HttpService.JSONDecode(getTileRemoteFunction.InvokeServer(this.tileEntity.position)));
            this.updateAmount();
        });
    }

    /**
     *  update the number about the amount of item in the input or the output
     */
    updateAmount() {
        if (!this.tileEntity) return

        if (!this.tileEntity.currentCraft) {
            this.menu.craft.progression["1itemIn"].TextLabel.Text = "0/0";
            this.menu.craft.progression["3itemOut"].TextLabel.Text = "0/0";
            return;
        }

        const [amountIn] = this.tileEntity.currentCraft.buildRessources

        this.menu.craft.progression["1itemIn"].TextLabel.Text = (tostring(this.tileEntity.resource) ?? "0") + "/" + tostring(amountIn[1]);
        this.menu.craft.progression["3itemOut"].TextLabel.Text = (tostring(this.tileEntity.craftedComponent) ?? "0") + "/" + tostring(this.tileEntity.currentCraft.amount);
    }

    public isVisible(): boolean {
        return this.menu.Visible;
    }

    public hide(): void {
        this.menu.Visible = false;
        RunService.UnbindFromRenderStep("crafterMenu");
    }

    public getMenu(): Frame {
        return this.menu;
    }
}

export default CrafterMenu;