/// <reference path="./Part.ts" />
/// <reference path="./Stats.ts" />

class LandingGear extends Part {
    private gear_list: { name: string, stats: Stats, DpLMP: number, SpLMP: number, can_retract: boolean }[];
    private gear_sel: number;
    private retract: boolean;
    private extra_list: { name: string, stats: Stats, MpLMP: number }[];
    private extra_sel: boolean[];
    private loadedMP: number;
    public can_boat: boolean;
    private gull_deck: number;

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

    public fromJSON(js: JSON, json_version: number) {
        this.gear_sel = js["gear_sel"];
        this.retract = js["retract"];
        this.extra_sel = js["extra_sel"];
    }

    public serialize(s: Serialize) {
        s.PushNum(this.gear_sel);
        s.PushBool(this.retract);
        s.PushBoolArr(this.extra_sel);
    }

    public deserialize(d: Deserialize) {
        this.gear_sel = d.GetNum();
        this.retract = d.GetBool();
        this.extra_sel = d.GetBoolArr();
    }

    public GetGearName() {
        if (this.retract && this.gear_list[this.gear_sel].name == "Boat Hull") {
            return "Retractable Gear + Boat Hull";
        }
        if (this.retract)
            return "Retractable " + this.gear_list[this.gear_sel].name;
        else
            return this.gear_list[this.gear_sel].name;
    }

    public GetGearList() {
        return this.gear_list;
    }

    public CanGear() {
        var count = [...Array(this.gear_list.length).fill(true)];
        for (let i = 0; i < this.gear_list.length; i++) {
            let g = this.gear_list[i];
            if (g.name == "Boat Hull" && !this.can_boat)
                count[i] = false;
        }
        return count;
    }

    public GetGear() {
        return this.gear_sel;
    }

    public SetGear(num: number) {
        if (this.CanGear()[num])
            this.gear_sel = num;
        this.CalculateStats();
    }

    public CanRetract() {
        return this.gear_list[this.gear_sel].can_retract
            || this.gear_list[this.gear_sel].name == "Boat Hull";
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
        this.loadedMP = Math.floor(1.0e-6 + mass / 5);
    }

    public CanBoat(engine_height: number, wing_height: number) {
        if (engine_height == 2)
            this.can_boat = true;
        else if (engine_height == 1 && wing_height >= 3)
            this.can_boat = true;
        else if (engine_height == 0 && wing_height >= 4)
            this.can_boat = true;
        else
            this.can_boat = false;
    }

    public SetGull(deck: number) {
        this.gull_deck = deck;
    }

    public SetCalculateStats(callback: () => void) {
        this.CalculateStats = callback;
    }

    public IsVital() {
        return this.gear_list[this.gear_sel].can_retract;
    }

    public PartStats() {
        var stats = new Stats();
        if (!this.CanGear()[this.gear_sel])
            this.gear_sel = 0;

        stats = stats.Add(this.gear_list[this.gear_sel].stats);
        var pdrag = this.gear_list[this.gear_sel].DpLMP * this.loadedMP;

        //Retractable gear with Boat Hull adds normal hull drag,
        // plus the mass and cost of normal retrctable gear
        if (this.gear_list[this.gear_sel].name == "Boat Hull" && this.retract) {
            stats.drag += pdrag;
            pdrag = this.gear_list[0].DpLMP * this.loadedMP;
        }

        //Gull wings don't affect Boat Hulls, but do affect the normal gear you get
        //if you put retract on your boat hull.  Since the hull is already applied,
        //we can just modify here.
        if (this.gear_list[this.gear_sel].name != "Boat Hull" || this.retract) {
            switch (this.gull_deck) {
                case 1: //Shoulder
                    pdrag -= Math.floor(1.0e-6 + 0.1 * pdrag);
                    break;
                case 2: //Mid
                case 3: //Low
                    pdrag -= Math.floor(1.0e-6 + 0.15 * pdrag);
                    break;
                case 4: //Gear
                    pdrag -= Math.floor(1.0e-6 + 0.25 * pdrag);
                    break;
                default:
                //No change
            }
        }

        if (this.retract) {
            stats.mass += Math.floor(1.0e-6 + pdrag / 2);
            stats.cost += Math.floor(1.0e-6 + pdrag / 2);
        } else {
            stats.drag += pdrag;
        }
        stats.structure += this.gear_list[this.gear_sel].SpLMP * this.loadedMP;

        for (let i = 0; i < this.extra_list.length; i++) {
            if (this.extra_sel[i]) {
                stats = stats.Add(this.extra_list[i].stats);
                stats.mass += Math.floor(1.0e-6 + this.extra_list[i].MpLMP * this.loadedMP);
            }
        }

        stats.Round();

        return stats;
    }
}