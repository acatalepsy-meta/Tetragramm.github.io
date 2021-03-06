/// <reference path="./Part.ts" />
/// <reference path="./Stats.ts" />
/// <reference path="./Cockpit.ts" />

class Cockpits extends Part {
    private positions: Cockpit[];
    private types: { name: string, stats: Stats }[];
    private upgrades: { name: string, stats: Stats }[];
    private safety: { name: string, stats: Stats }[];
    private gunsights: { name: string, attack: number, stats: Stats }[];

    constructor(js: JSON) {
        super();
        this.positions = [];

        this.types = [];
        //Add all the cockpit types
        for (let elem of js["options"]) {
            let opt = { name: elem["name"], stats: new Stats(elem) };
            this.types.push(opt);
        }
        this.upgrades = [];
        //Add all the upgrades
        for (let elem of js["upgrades"]) {
            let upg = { name: elem["name"], stats: new Stats(elem) };
            this.upgrades.push(upg);
        }
        this.safety = [];
        //Add all the safety
        for (let elem of js["safety"]) {
            let sft = { name: elem["name"], stats: new Stats(elem) };
            this.safety.push(sft);
        }
        this.gunsights = [];
        //Add all the gunsights
        for (let elem of js["gunsights"]) {
            let gun = { name: elem["name"], attack: elem["attack"], stats: new Stats(elem) };
            this.gunsights.push(gun);
        }
    }

    public toJSON() {
        var lst = [];
        for (let cp of this.positions) {
            lst.push(cp.toJSON());
        }
        return { positions: lst };
    }

    public fromJSON(js: JSON, json_version: number) {
        this.positions = [];
        for (let elem of js["positions"]) {
            let cp = new Cockpit(this.types, this.upgrades, this.safety, this.gunsights);
            if (this.positions.length == 0)
                cp.SetPrimary();
            cp.fromJSON(elem, json_version);
            cp.SetCalculateStats(this.CalculateStats);
            this.positions.push(cp);

        }
    }

    public serialize(s: Serialize) {
        s.PushNum(this.positions.length);
        for (let cp of this.positions) {
            cp.serialize(s);
        }
    }

    public deserialize(d: Deserialize) {
        var len = d.GetNum();
        this.positions = [];
        for (let i = 0; i < len; i++) {
            let cp = new Cockpit(this.types, this.upgrades, this.safety, this.gunsights);
            if (this.positions.length == 0)
                cp.SetPrimary();
            cp.deserialize(d);
            cp.SetCalculateStats(this.CalculateStats);
            this.positions.push(cp);
        }
    }

    public GetAttackList() {
        var lst = [];
        for (let c of this.positions) {
            lst.push(c.GetAttack());
        }
        return lst;
    }

    public GetVisibilityList() {
        var lst = [];
        for (let p of this.positions) {
            lst.push(p.GetVisibility());
        }
        return lst;
    }

    public GetStressList() {
        var lst = [];
        for (let p of this.positions) {
            lst.push(p.GetFlightStress());
        }
        return lst;
    }

    public GetEscapeList() {
        var lst = [];
        for (let p of this.positions) {
            lst.push(p.GetEscape());
        }
        return lst;
    }

    public GetCrashList() {
        return [this.positions[0].GetCrash()];
    }

    public SetNumberOfCockpits(num: number) {
        if (num != num || num < 1)
            num = 1;
        num = Math.floor(1.0e-6 + num);
        while (this.positions.length > num) {
            this.positions.pop();
        }
        var js = null;
        if (this.positions.length > 0) {
            js = JSON.stringify(this.positions[this.positions.length - 1].toJSON());
        }
        while (this.positions.length < num) {
            let cp = new Cockpit(this.types, this.upgrades, this.safety, this.gunsights);
            if (this.positions.length == 0)
                cp.SetPrimary();
            if (js)
                cp.fromJSON(JSON.parse(js), 1000);
            cp.SetCalculateStats(this.CalculateStats);
            this.positions.push(cp);
        }
        this.CalculateStats();
    }

    public GetNumberOfCockpits() {
        return this.positions.length;
    }

    public GetCockpit(index: number) {
        return this.positions[index];
    }

    public HasOpen() {
        for (let c of this.positions) {
            if (c.IsOpen())
                return true;
        }
        return false;
    }

    public SetHasRotary(has: boolean) {
        for (let c of this.positions) {
            c.SetHasRotary(has);
        }
    }

    public PartStats(): Stats {
        var s = new Stats();
        for (let cp of this.positions) {
            s = s.Add(cp.PartStats());
        }
        //Local only stats don't get rolled up into the aircraft as a whole.
        s.escape = 0;
        //This needs special work for co-pilot controls
        //s.flightstress = 0;
        s.visibility = 0;
        s.crashsafety = 0;
        return s;
    }

    public UpdateCrewStats(escape: number, flightstress: number, visibility: number, crash: number) {
        for (let cp of this.positions) {
            cp.CrewUpdate(escape, flightstress, visibility, crash);
        }
    }

    public SetCalculateStats(callback: () => void) {
        this.CalculateStats = callback;
    }
}