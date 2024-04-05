import stableFileManager from "./StableFileManager.js";
import localA1111Settings from "./localA1111Settings.js";
import sdAPIClient from "./localA1111APIClient.js";
import AiHordeSettings from "./aiHordeSettings.js";
import { aiHordeApiClient } from "./aiHordeApiClient.js";

const defaultPrefix = 'best quality, absurdres, aesthetic,';
const defaultNegative = 'lowres, bad anatomy, bad hands, text, error, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry';
const defaultStyles = [
    {
        name: 'Default',
        negative: defaultNegative,
        prefix: defaultPrefix,
    },
];

const promptTemplates = {};

const resolutionOptions = {
    sd_res_512x512: { width: 512, height: 512, name: '512x512 (1:1, icons, profile pictures)' },
    sd_res_600x600: { width: 600, height: 600, name: '600x600 (1:1, icons, profile pictures)' },
    sd_res_512x768: { width: 512, height: 768, name: '512x768 (2:3, vertical character card)' },
    sd_res_768x512: { width: 768, height: 512, name: '768x512 (3:2, horizontal 35-mm movie film)' },
    sd_res_960x540: { width: 960, height: 540, name: '960x540 (16:9, horizontal wallpaper)' },
    sd_res_540x960: { width: 540, height: 960, name: '540x960 (9:16, vertical wallpaper)' },
    sd_res_1920x1088: { width: 1920, height: 1088, name: '1920x1088 (16:9, 1080p, horizontal wallpaper)' },
    sd_res_1088x1920: { width: 1088, height: 1920, name: '1088x1920 (9:16, 1080p, vertical wallpaper)' },
    sd_res_1280x720: { width: 1280, height: 720, name: '1280x720 (16:9, 720p, horizontal wallpaper)' },
    sd_res_720x1280: { width: 720, height: 1280, name: '720x1280 (9:16, 720p, vertical wallpaper)' },
    sd_res_1024x1024: { width: 1024, height: 1024, name: '1024x1024 (1:1, SDXL)' },
    sd_res_1152x896: { width: 1152, height: 896, name: '1152x896 (9:7, SDXL)' },
    sd_res_896x1152: { width: 896, height: 1152, name: '896x1152 (7:9, SDXL)' },
    sd_res_1216x832: { width: 1216, height: 832, name: '1216x832 (19:13, SDXL)' },
    sd_res_832x1216: { width: 832, height: 1216, name: '832x1216 (13:19, SDXL)' },
    sd_res_1344x768: { width: 1344, height: 768, name: '1344x768 (4:3, SDXL)' },
    sd_res_768x1344: { width: 768, height: 1344, name: '768x1344 (3:4, SDXL)' },
    sd_res_1536x640: { width: 1536, height: 640, name: '1536x640 (24:10, SDXL)' },
    sd_res_640x1536: { width: 640, height: 1536, name: '640x1536 (10:24, SDXL)' },
};

const defaultSettings = {
    // CFG Scale
    scale_min: 1,
    scale_max: 30,
    scale_step: 0.5,
    scale: 7,
    // Sampler steps
    steps_min: 1,
    steps_max: 150,
    steps_step: 1,
    steps: 20,

    // Scheduler
    scheduler: 'normal',
    // Image dimensions (Width & Height)
    dimension_min: 64,
    dimension_max: 2048,
    dimension_step: 64,
    width: 512,
    height: 512,

    prompt_prefix: defaultPrefix,
    negative_prompt: defaultNegative,
    sampler: 'DDIM',
    model: '',
    vae: '',
    
    // Automatic1111/Horde exclusives
    restore_faces: false,
    enable_hr: false,

    sd_resolution: 'sd_res_512x512',

    // Horde settings
    horde_url: 'https://stablehorde.net',
    horde: false,
    horde_nsfw: false,
    horde_karras: true,
    horde_sanitize: true,
    horde_model: '',
    horde_models: [],

    // Refine mode
    refine_mode: false,
    expand: false,
    interactive_mode: false,
    multimodal_captioning: false,
    snap: false,

    prompts: promptTemplates,
    
    // AUTOMATIC1111 settings
    auto_url: 'http://localhost:7860',
    auto_auth: '',

    vlad_url: 'http://localhost:7860',
    vlad_auth: '',

    hr_upscaler: 'Latent',
    hr_scale: 2.0,
    hr_scale_min: 1.0,
    hr_scale_max: 4.0,
    hr_scale_step: 0.1,
    denoising_strength: 0.7,
    denoising_strength_min: 0.0,
    denoising_strength_max: 1.0,
    denoising_strength_step: 0.01,
    hr_second_pass_steps: 0,
    hr_second_pass_steps_min: 0,
    hr_second_pass_steps_max: 150,
    hr_second_pass_steps_step: 1,

    // NovelAI settings
    novel_upscale_ratio_min: 1.0,
    novel_upscale_ratio_max: 4.0,
    novel_upscale_ratio_step: 0.1,
    novel_upscale_ratio: 1.0,
    novel_anlas_guard: false,

    // OpenAI settings
    openai_style: 'vivid',
    openai_quality: 'standard',

    style: 'Default',
    styles: defaultStyles,

    // ComyUI settings
    comfy_url: 'http://127.0.0.1:8188',
    comfy_workflow: 'Default_Comfy_Workflow.json',

    // stable-images old settings TO BE DEPRECATED
    batchCount: 1,
    loras: [],
    styles: [],
    loraPrompt: '',
    activeLoras: [],
    activeModel: '',
    models: {},

    // Resolution options
    resolutionOptions: {
        sd_res_512x512: { width: 512, height: 512, name: '512x512 (1:1, icons, profile pictures)' },
        sd_res_600x600: { width: 600, height: 600, name: '600x600 (1:1, icons, profile pictures)' },
        sd_res_512x768: { width: 512, height: 768, name: '512x768 (2:3, vertical character card)' },
        sd_res_768x512: { width: 768, height: 512, name: '768x512 (3:2, horizontal 35-mm movie film)' },
        sd_res_960x540: { width: 960, height: 540, name: '960x540 (16:9, horizontal wallpaper)' },
        sd_res_540x960: { width: 540, height: 960, name: '540x960 (9:16, vertical wallpaper)' },
        sd_res_1920x1088: { width: 1920, height: 1088, name: '1920x1088 (16:9, 1080p, horizontal wallpaper)' },
        sd_res_1088x1920: { width: 1088, height: 1920, name: '1088x1920 (9:16, 1080p, vertical wallpaper)' },
        sd_res_1280x720: { width: 1280, height: 720, name: '1280x720 (16:9, 720p, horizontal wallpaper)' },
        sd_res_720x1280: { width: 720, height: 1280, name: '720x1280 (9:16, 720p, vertical wallpaper)' },
        sd_res_1024x1024: { width: 1024, height: 1024, name: '1024x1024 (1:1, SDXL)' },
        sd_res_1152x896: { width: 1152, height: 896, name: '1152x896 (9:7, SDXL)' },
        sd_res_896x1152: { width: 896, height: 1152, name: '896x1152 (7:9, SDXL)' },
        sd_res_1216x832: { width: 1216, height: 832, name: '1216x832 (19:13, SDXL)' },
        sd_res_832x1216: { width: 832, height: 1216, name: '832x1216 (13:19, SDXL)' },
        sd_res_1344x768: { width: 1344, height: 768, name: '1344x768 (4:3, SDXL)' },
        sd_res_768x1344: { width: 768, height: 1344, name: '768x1344 (3:4, SDXL)' },
        sd_res_1536x640: { width: 1536, height: 640, name: '1536x640 (24:10, SDXL)' },
        sd_res_640x1536: { width: 640, height: 1536, name: '640x1536 (10:24, SDXL)' },
    },
    
    // Source options
    SOURCE_OPTIONS: [
        { value: 'stable-horde', label: 'Stable Horde', selected: false },
        { value: 'automatic1111', label: 'Stable Diffusion Web UI (AUTOMATIC1111)', selected: true }
    ],
};

/**
 * Registers the settings for the Stable Images module.
 */
export default function registerSettings() {
    // Dynamically register settings based on defaultSettings
    Object.entries(defaultSettings).forEach(([key, defaultValue]) => {
        game.settings.register('stable-images', key, {
            name: key,
            hint: `Setting for ${key}`,
            scope: 'world',
            config: false,
            type: determineSettingType(defaultValue),
            default: defaultValue,
            onChange: value => console.log(`Setting '${key}' changed to:`, value)
        });
    });

    // Register menus
    game.settings.registerMenu("stable-images", "stable-image-menu", {
        name: "Local A1111 Images Settings",
        label: "Local A1111 Images Settings",
        hint: "A window to set parameters for A1111 image generation.",
        icon: "fas fa-images",
        type: localA1111Settings,
        restricted: true
    });

    game.settings.registerMenu('stable-images', 'aihorde-settings', {
        name: 'AI Horde Settings',
        label: 'AI Horde Settings',
        hint: 'Configure the connection to the AI Horde API.',
        icon: 'fas fa-cog',
        type: AiHordeSettings,
        restricted: true,
    });

    // Register stable-settings
    game.settings.register('stable-images', 'stable-settings', {
        scope: 'world',
        config: false,
        type: Object,
        default: {},
        /**
         * Handles the onChange event for the stable-settings.
         * Calls the getLocalA1111Settings function from the sdAPIClient.
         */
        onChange: async () => {
            try {
                await sdAPIClient.getLocalA1111Settings();
            } catch (error) {
                console.error("Error calling getLocalA1111Settings:", error);
                ui.notifications.error("Failed to retrieve Local A1111 settings. Check the console for more details.");
            }
        }
    });
}

/**
 * Determines the setting type based on the provided value.
 * @param {*} value - The value to determine the setting type for.
 * @returns {Function} The determined setting type.
 */
function determineSettingType(value) {
    if (typeof value === 'boolean') return Boolean;
    if (typeof value === 'number') return Number;
    if (Array.isArray(value)) return Array;
    if (typeof value === 'object' && value !== null) return Object;
    return String; // Default to string for everything else
}

export { resolutionOptions };
export { defaultSettings };