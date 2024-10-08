export default class PromptApplication extends FormApplication {
    constructor(prompt, actorUuid) {
        super();
        this.basePrompt = prompt;
        this.actorId = actorUuid;
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ['form', 'stable-image'],
            popOut: true,
            closeOnSubmit: true,
            template: 'modules/arcane-artifex/templates/promptApp.hbs',
            id: 'creaPerso',
            title: "actor prompt",
            width: 400,
            height: 400,
            left: 200,
            top: 200
        });
    }

    getData() {
        return mergeObject(super.getData(), {
            basePrompt: this.basePrompt
        });
    }

    _updateObject() {
        const prompt = this.form.querySelector('[name="basePrompt"]').value;
        const msgData = {
            user: game.user.id,
            type: 1,
            speaker: ChatMessage.getSpeaker(),
            content: prompt,
            flags: {
                'arcane-artifex': {
                    fromActor: this.actorId
                }
            }
        };
        ChatMessage.create(msgData);
    }
}
