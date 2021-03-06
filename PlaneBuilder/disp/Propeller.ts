/// <reference path="./Display.ts" />
/// <reference path="../impl/Propeller.ts" />

class Propeller_HTML extends Display {
    private prop: Propeller;
    private select_prop: HTMLSelectElement;
    private input_variable: HTMLInputElement;

    constructor(prop: Propeller) {
        super();
        this.prop = prop;

        this.select_prop = document.getElementById("propeller_pitch") as HTMLSelectElement;
        for (let elem of prop.GetPropList()) {
            let opt = document.createElement("OPTION") as HTMLOptionElement;
            opt.text = elem.name;
            this.select_prop.add(opt);
        }
        this.select_prop.onchange = () => { this.prop.SetPropIndex(this.select_prop.selectedIndex); };

        this.input_variable = document.getElementById("propeller_variable") as HTMLInputElement;
        this.input_variable.onchange = () => { this.prop.SetVariable(this.input_variable.checked); };
    }

    public UpdateDisplay() {
        this.input_variable.checked = this.prop.GetVariable();
        this.input_variable.disabled = !this.prop.CanBeVariable();
        this.select_prop.selectedIndex = this.prop.GetPropIndex();
        this.select_prop.disabled = false;

        if (!this.prop.GetHavePropeller()) {
            this.input_variable.disabled = true;
            this.select_prop.disabled = true;
            this.select_prop.selectedIndex = -1;
        }
    }
}