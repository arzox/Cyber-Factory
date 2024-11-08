const tileEntitiesList: Map<string, { name: string, category: string, tier: number, speed: number, price: number, image: string }> = new Map([
    ["conveyor", {
        name: "conveyor",
        category: "conveyor",
        speed: 60,
        tier: 1,
        price: 50,
        image: "88240255345711",
    }],
    ["generator", {
        name: "generator",
        category: "generator",
        speed: 0,
        tier: 1,
        price: 500,
        image: "82799492428452",
    }],
    ["seller", {
        name: "seller",
        category: "seller",
        tier: 1,
        speed: 1,
        price: 1000,
        image: "",
    }],
    ["merger", {
        name: "merger",
        category: "merger",
        speed: 60,
        tier: 1,
        price: 150,
        image: "",
    }],
    ["splitter", {
        name: "splitter",
        category: "splitter",
        speed: 60,
        tier: 1,
        price: 150,
        image: "",
    }],
    ["crafter", {
        name: "crafter",
        category: "crafter",
        speed: 60,
        tier: 1,
        price: 500,
        image: "",
    }],
    ["assembler", {
        name: "assembler",
        category: "assembler",
        speed: 60,
        tier: 1,
        price: 500,
        image: "",
    }]
]);

export default tileEntitiesList;
