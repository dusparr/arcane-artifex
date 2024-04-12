import sdAPIClient from "./sdAPIClient.js";

export default class LocalA1111Settings extends FormApplication {
    constructor(...args) {
        super();
        this.loadingModel = false;
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["stable-images", "stable-setting-sheet"],
            template: "modules/stable-images/templates/stable-settings.hbs",
            width: 800,
            height: "auto",
            title: "Settings for Stable Diffusion Image Generation",
            resizable: true
        });
    }

    getData() {
        let context = game.settings.get('stable-images', 'stable-settings');
        context.source = game.settings.get("stable-images", "source");
        context.localA1111Sampler = game.settings.get("stable-images", "localA1111Sampler");
        context.localA1111Upscaler = game.settings.get("stable-images", "localA1111Upscaler");
        context.activeModel = game.settings.get("stable-images", "localA1111Model");
        context.numImages = game.settings.get("stable-images", "numImages");
        context.stableStoragePath = game.settings.get("stable-images", "stableStoragePath");



        context.loras = sdAPIClient.localA1111Loras;
        context.models = game.settings.get("stable-images", "localA1111Models");
        console.error(context.models);
        context.styles = sdAPIClient.localA1111Styles;
        context.upscalers = sdAPIClient.localA1111Upscalers;
        context.samplers = sdAPIClient.localA1111Samplers;

        console.error(context);

        if (!context.activeLoras) {
            context.activeLoras = [];
        }

        this.context = context;
        return context;
    }

    activateListeners(html) {
        super.activateListeners(html);
        this.changeLoraPrompt();

        html[0].querySelector('select#change-model').addEventListener('change', this.changeModel.bind(this));
        html[0].querySelector('select#change-sampler').addEventListener('change', this.changeSampler.bind(this));
        html[0].querySelector('select#change-upscaler').addEventListener('change', this.changeUpscaler.bind(this));

        for (let span of html[0].querySelectorAll('span.lora-choice')) {
            let activeMap = this.context.activeLoras?.map(l => l.alias);
            if (activeMap?.indexOf(span.innerText) > -1) {
                span.classList.add('active');
            }
            span.addEventListener('click', this.toggleLora.bind(this));
        }

        for (let range of html.find('.form-group.active-lora .stable-lora-value')) {
            range.addEventListener('change', this.changeLoraPrompt.bind(this));
        }

        html.find('input[name="numImages"]').on("input", async (event) => {
            await game.settings.set("stable-images", "numImages", parseInt(event.target.value));
            this.render(true);
        });

        html.find('select[name="source"]').on("change", async (event) => {
            await game.settings.set("stable-images", "source", event.target.value);
            this.render();
        });
    }

    async onChooseStableStorage(event) {
        event.preventDefault();
        const pickerOptions = {
            callback: (path) => {
                this.context.stableStoragePath = path;
                this.render();
            },
            multiple: false,
            type: 'folder',
            current: this.context.stableStoragePath
        };
        new FilePicker(pickerOptions).browse();
    }

    async changeModel(ev) {
        ev.preventDefault();
        let sel = ev.currentTarget;
        let modelTitle = sel.options[sel.selectedIndex].value;
        await game.settings.set("stable-images", "localA1111Model", modelTitle);
        sdAPIClient.changeModel(modelTitle).then(this.render(true));
    }

    async changeSampler(ev) {
        ev.preventDefault();
        let sel = ev.currentTarget;
        let samplerName = sel.options[sel.selectedIndex].value;
        await game.settings.set("stable-images", "localA1111Sampler", samplerName);
        this.render(true);
    }

    async changeUpscaler(ev) {
        ev.preventDefault();
        let sel = ev.currentTarget;
        let upscalerName = sel.options[sel.selectedIndex].value;
        await game.settings.set("stable-images", "localA1111Upscaler", upscalerName);
        this.render(true);
    }

    async toggleLora(ev) {
        let loraAlias = ev.currentTarget.innerText;
        let lora = this.context.loras.find(l => l.alias === loraAlias);
        lora.value = 0;
        let toActive = true;

        this.context.activeLoras.forEach((active, index) => {
            if (active.alias === lora.alias) {
                this.context.activeLoras.splice(index, 1);
                toActive = false;
            }
        });

        if (toActive) {
            this.context.activeLoras.push(lora);
        }

        if (!this.context.activeLoras) {
            this.context.activeLoras = [];
        }


        await game.settings.set('stable-images', 'stable-settings', this.context);
        this.render(true);
    }

    async changeLoraPrompt() {
        let html = this.form;
        let lorPrompt = "";

        for (let loraEl of html.getElementsByClassName('active-lora')) {
            let range = loraEl.querySelector('input');
            let targetLora = this.context.activeLoras.find(l => l.name == range.dataset.loraAlias);

            if (targetLora) {
                targetLora.value = range.value;
            }

            let newString = `<lora:${range.dataset.loraAlias}:${range.value}>`;
            lorPrompt += newString;
        }

        html.querySelector('textarea[name="loraPrompt"]').value = lorPrompt;
        this.context.loraPrompt = lorPrompt;
    }

    _updateObject(event, formData) {
        const data = {  };
        

        game.settings.set('stable-images', 'stable-settings', data);
    }
}
