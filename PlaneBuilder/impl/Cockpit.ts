/// <reference path="./Part.ts" />
/// <reference path="./Stats.ts" />

class Cockpit extends Part {
    private stats: Stats;
    private types: { name: string, stats: Stats }[];
    private upgrades: { name: string, stats: Stats }[];
    private safety: { name: string, stats: Stats }[];
    private gunsights: { name: string, attack: number, stats: Stats }[];
    private selected_type: number;
    private selected_upgrades: boolean[];
    private selected_safety: boolean[];
    private selected_gunsights: boolean[];
    private total_stress: number;
    private total_escape: number;
    private total_visibility: number;
    private total_crash: number;
    private is_primary: boolean;
    private bombsight: number;
    private has_rotary: boolean;

    constructor(tl: { name: string, stats: Stats }[],
        ul: { name: string, stats: Stats }[],
        sl: { name: string, stats: Stats }[],
        gl: { name: string, attack: number, stats: Stats }[]
    ) {
        super();
        this.stats = new Stats();
        this.types = tl;
        this.upgrades = ul;
        this.safety = sl;
        this.gunsights = gl;
        this.selected_type = 0;
        this.selected_upgrades = [...Array(this.upgrades.length).fill(false)];
        this.selected_safety = [...Array(this.safety.length).fill(false)];
        this.selected_gunsights = [...Array(this.gunsights.length).fill(false)];
        this.total_stress = 0;
        this.total_escape = 0;
        this.total_visibility = 0;
        this.is_primary = false;
        this.bombsight = 0;
    }

    public toJSON() {
        return {
            type: this.selected_type,
            upgrades: this.selected_upgrades,
            safety: this.selected_safety,
            sights: this.selected_gunsights,
            bombsight: this.bombsight,
        };
    }

    public fromJSON(js: JSON, json_version: number) {
        this.selected_type = js["type"];
        this.selected_upgrades = js["upgrades"];
        this.selected_safety = js["safety"];
        this.selected_gunsights = js["sights"];
        if (this.is_primary)
            this.selected_upgrades[0] = false;
        if (json_version > 10.35)
            this.bombsight = js["bombsight"];
    }

    public serialize(s: Serialize) {
        s.PushNum(this.selected_type);
        s.PushBoolArr(this.selected_upgrades);
        s.PushBoolArr(this.selected_safety);
        s.PushBoolArr(this.selected_gunsights);
        s.PushNum(this.bombsight);
    }

    public deserialize(d: Deserialize) {
        this.selected_type = d.GetNum();
        this.selected_upgrades = d.GetBoolArr();
        this.selected_safety = d.GetBoolArr();
        this.selected_gunsights = d.GetBoolArr();
        if (this.is_primary)
            this.selected_upgrades[0] = false;
        if (d.version > 10.35)
            this.bombsight = d.GetNum();
    }

    public GetTypeList() {
        return this.types;
    }

    public GetUpgradeList() {
        return this.upgrades;
    }

    public GetSafetyList() {
        return this.safety;
    }

    public GetGunsightList() {
        return this.gunsights;
    }

    public GetType() {
        return this.selected_type;
    }

    public SetType(index: number) {
        if (index >= this.types.length)
            throw "Selected type is not in range of actual types.";
        this.selected_type = index;
        this.CalculateStats();
    }

    public GetSelectedUpgrades() {
        return this.selected_upgrades;
    }

    public SetUpgrade(index: number, state: boolean) {
        if (index >= this.upgrades.length)
            throw "Selected type is not in range of actual upgrades.";
        this.selected_upgrades[index] = state;
        this.CalculateStats();
    }

    public GetSelectedSafety() {
        return this.selected_safety;
    }

    public SetSafety(index: number, state: boolean) {
        if (index >= this.safety.length)
            throw "Selected type is not in range of actual safties.";
        this.selected_safety[index] = state;
        this.CalculateStats();
    }

    public GetSelectedGunsights() {
        return this.selected_gunsights;
    }

    public SetGunsight(index: number, state: boolean) {
        if (index >= this.safety.length)
            throw "Selected type is not in range of actual gunsights.";
        this.selected_gunsights[index] = state;
        this.CalculateStats();
    }

    public GetVisibility() {
        return this.total_visibility;
    }

    public GetFlightStress() {
        return this.total_stress;
    }

    public GetEscape() {
        return this.total_escape;
    }

    public GetCrash() {
        return this.total_crash;
    }

    public GetAttack() {
        var mx = 0;
        for (let i = 0; i < this.gunsights.length; i++) {
            if (this.selected_gunsights[i]) {
                mx = Math.max(mx, this.gunsights[i].attack);
            }
        }
        return mx;
    }

    public SetPrimary() {
        this.is_primary = true;
    }

    public CanUpgrades() {
        var can = [...Array(this.upgrades.length).fill(true)];
        if (this.is_primary) {
            can[0] = false;
        }
        return can;
    }

    public IsOpen() {
        return this.types[this.selected_type].name == "Open";
    }

    public GetBombsightQuality() {
        return this.bombsight;
    }

    public SetBombsightQuality(num: number) {
        if (num != num)
            num = 0;
        if (num == this.bombsight - 1)
            num = this.bombsight - 3;
        if (num == this.bombsight + 1)
            num = this.bombsight + 3;
        if (num < 2)
            num = 0;
        if (num > 0)
            num = num - (num % 3) + 1;
        this.bombsight = num;
        this.CalculateStats();
    }

    public SetHasRotary(has: boolean) {
        this.has_rotary = has;
    }

    public PartStats(): Stats {
        var stats = new Stats();
        stats.reqsections = 1;

        stats = stats.Add(this.types[this.selected_type].stats);

        for (let i = 0; i < this.selected_upgrades.length; i++) {
            if (this.selected_upgrades[i])
                stats = stats.Add(this.upgrades[i].stats);
        }

        for (let i = 0; i < this.selected_safety.length; i++) {
            if (this.selected_safety[i])
                stats = stats.Add(this.safety[i].stats);
        }

        for (let i = 0; i < this.selected_gunsights.length; i++) {
            if (this.selected_gunsights[i])
                stats = stats.Add(this.gunsights[i].stats);
        }

        if (this.bombsight > 0) {
            stats.cost += Math.floor(1.0e-6 + 2 + (this.bombsight - 4) / 3);
            stats.warnings.push({ source: "Bombsight", warning: "Subtract " + this.bombsight.toString() + " from your Altitude when rolling for bombing." });
        }

        this.stats = stats.Clone();


        //Special stuff for co-pilot controls
        if (this.selected_upgrades[0]) {
            stats.flightstress = this.upgrades[0].stats.flightstress;
            this.stats.flightstress -= stats.flightstress;
        }
        else {
            stats.flightstress = 0;
        }

        return stats;
    }

    public CrewUpdate(escape: number, flightstress: number, visibility: number, crash: number) {
        this.total_escape = this.stats.escape + escape;
        this.total_stress = this.stats.flightstress + flightstress;
        if (this.selected_type == 0 && this.has_rotary) { //Is open and has rotary
            this.total_stress += 1;
        }
        this.total_stress = Math.max(0, this.total_stress);
        this.total_visibility = this.stats.visibility + visibility;
        this.total_crash = this.stats.crashsafety + crash;
    }

    public SetCalculateStats(callback: () => void) {
        this.CalculateStats = callback;
    }
}