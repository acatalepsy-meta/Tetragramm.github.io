// export { LandingGear };

// import { Part } from "./Part";
// import { Stats } from "./Stats";
/// <reference path="./Part.ts" />
/// <reference path="./Stats.ts" />

class LandingGear extends Part {
    private gear_list: { name: string, stats: Stats, DpLMP: number, SpLMP: number, can_retract: boolean }[];
    private gear_sel: number;
    private retract: boolean;
    private extra_list: { name: string, stats: Stats, MpLMP: number }[];
    private extra_sel: boolean[];
    private loadedMP: number;

    constructor(js: JSON) {
        super();

        this.gear_list = [];
        this.gear_sel = 0;
        this.retract = false;
        for (let elem of js["gear"]) {
            this.gear_list.push({
                name: elem["name"],
                stats: new Stats(elem),
                DpLMP: elem["DpLMP"],
                SpLMP: elem["SpLMP"],
                can_retract: elem["can_retract"]
            });
        }

        this.extra_list = [];
        for (let elem of js["extras"]) {
            this.extra_list.push({
                name: elem["name"],
                stats: new Stats(elem),
                MpLMP: elem["MpLMP"]
            });
        }
        this.extra_sel = [...Array(this.extra_list.length).fill(false)];
    }

    public toJSON() {
        return {
            gear_sel: this.gear_sel,
            retract: this.retract,
            extra_sel: this.extra_sel,
        };
    }

    public fromJSON(js: JSON) {
        this.gear_sel = js["gear_sel"];
        this.retract = js["retract"];
        this.extra_sel = js["extra_sel"];
    }

    public GetGearName() {
        if (this.retract)
            return "Retractable " + this.gear_list[this.gear_sel].name;
        else
            return this.gear_list[this.gear_sel].name;
    }

    public GetGearList() {
        return this.gear_list;
    }

    public GetGear() {
        return this.gear_sel;
    }

    public SetGear(num: number) {
        this.gear_sel = num;
        this.CalculateStats();
    }

    public CanRetract() {
        return this.gear_list[this.gear_sel].can_retract;
    }

    public GetRetract() {
        return this.retract;
    }

    public SetRetract(is: boolean) {
        this.retract = is && this.CanRetract();
        this.CalculateStats();
    }

    public GetExtraList() {
        return this.extra_list;
    }

    public GetExtraSelected() {
        return this.extra_sel;
    }

    public SetExtraSelected(idx: number, is: boolean) {
        this.extra_sel[idx] = is;
        this.CalculateStats();
    }

    public SetLoadedMass(mass: number) {
        this.loadedMP = Math.floor(mass / 5);
    }

    public SetCalculateStats(callback: () => void) {
        this.CalculateStats = callback;
    }

    public PartStats() {
        var stats = new Stats();

        stats = stats.Add(this.gear_list[this.gear_sel].stats);
        var pdrag = this.gear_list[this.gear_sel].DpLMP * this.loadedMP;
        if (this.retract) {
            stats.mass += Math.floor(pdrag / 2);
            stats.cost += Math.floor(pdrag / 2);
        } else {
            stats.drag += pdrag;
        }
        stats.structure += this.gear_list[this.gear_sel].SpLMP * this.loadedMP;

        for (let i = 0; i < this.extra_list.length; i++) {
            if (this.extra_sel[i]) {
                stats = stats.Add(this.extra_list[i].stats);
                stats.mass += this.extra_list[i].MpLMP * this.loadedMP;
            }
        }

        return stats;
    }
}