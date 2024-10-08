import chatListener from "./ChatListener.js";

class HordeAPIClient {
  async checkStatus() {
    const selectedSource = game.settings.get('arcane-artifex', 'source');
  
    if (selectedSource === 'aiHorde') {
      const aiHordeUrl = game.settings.get('arcane-artifex', 'hordeUrl');
      const statusUrl = `${aiHordeUrl}/api/v2/status/heartbeat`;
        
      try {
        const response = await fetch(statusUrl);
        if (response.ok) {
          console.log('AI Horde server is accessible at:', aiHordeUrl);
          ui.notifications.info('AI Horde server is accessible.');
          return 'AI Horde API is accessible.';
        } else {
          console.error('AI Horde server is not accessible: response code', response.status, 'at URL:', aiHordeUrl);
          ui.notifications.error(`AI Horde server is not accessible: response code: ${response.status}`);
          throw new Error(`AI Horde API returned an error: ${response.status}`);
        }
      } catch (error) {
        console.error('Error occurred while trying to access AI Horde server at URL:', aiHordeUrl, '; error =', error);
        ui.notifications.error(`Error occurred while trying to access AI Horde server; error = ${error}`);
      }
    } else {
      console.log("Stable Horde is not selected. Skipping AI Horde status check.");
      return 'Stable Horde is not selected. Skipping AI Horde status check.';
    }
  }

  async getSettings() {
    const connection = game.settings.get('arcane-artifex', 'connected');

    if (!connection) {
      console.log("Local AI Horde connection not established. Skipping API calls.");
      return;
    }

    const { hordeModels, hordeModel } = await this.loadHordeModels();
    await game.settings.set('arcane-artifex', 'hordeModels', hordeModels);
    await game.settings.set('arcane-artifex', 'hordeModel', hordeModel);
    const samplers = await this.fetchSamplersFromSwagger();
    await game.settings.set('arcane-artifex', 'hordeSamplers', samplers);
    let currentSampler = game.settings.get('arcane-artifex', 'hordeSampler');
    if (!samplers.includes(currentSampler)) {
      currentSampler = samplers[0]; // Default to the first sampler if current is not in the list
      await game.settings.set('arcane-artifex', 'hordeSampler', currentSampler);
    }
  

  }
  async fetchSamplersFromSwagger() {
    const hordeUrl = game.settings.get('arcane-artifex', 'hordeUrl');
    const url = `${hordeUrl}/api/swagger.json`;
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const samplers = data.definitions.ModelPayloadRootStable.properties.sampler_name.enum;
        return samplers;
    } catch (error) {
        console.error('Failed to fetch or parse the Swagger JSON:', error);
        return null;
    }
}
  async loadHordeModels() {
    try {
        const hordeUrl = game.settings.get('arcane-artifex', 'hordeUrl');
        const response = await fetch(`${hordeUrl}/api/v2/status/models`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (response.ok) {
            const data = await response.json();
            data.sort((a, b) => b.count - a.count);

            const hordeModels = data.map(x => ({
                value: x.name,
                text: `${x.name} (ETA: ${x.eta}s, Queue: ${x.queued}, Workers: ${x.count})`
            }));

            let hordeModel = game.settings.get('arcane-artifex', 'hordeModel');

            if (!hordeModel || !hordeModels.some(model => model.value === hordeModel)) {
                hordeModel = hordeModels[0].value;
            }

            return { hordeModels, hordeModel };
        } else {
            ui.notifications.error(`Error while retrieving Horde models: ${response.statusText}`);
            return { hordeModels: [], hordeModel: '' };
        }
    } catch (error) {
        ui.notifications.error(`Error while retrieving Horde models: ${error}`);
        return { hordeModels: [], hordeModel: '' };
    }
}


async textToImg(prompt, message) {
  const aiHordeUrl = game.settings.get('arcane-artifex', 'hordeUrl');
  const apiUrl = `${aiHordeUrl}/api/v2/generate/async`;
 
  const requestBody = {
    prompt: prompt,
    nsfw: game.settings.get("arcane-artifex", "hordeNSFW"), 
    censor_nsfw: false,
    trusted_workers: false,
    slow_workers: true,
    shared: false,
    replacement_filter: true,
    worker_blacklist: false,
    dry_run: false,
    r2: true,
    models: [game.settings.get("arcane-artifex", "hordeModel")],
    workers: [], 
    params: {
      n: 1,
      width: game.settings.get("arcane-artifex", "hordeWidth"),
      height: game.settings.get("arcane-artifex", "hordeHeight"),
      steps: game.settings.get("arcane-artifex", "hordeSamplerSteps"),
      sampler_name: game.settings.get("arcane-artifex", "hordeSampler"),
      cfg_scale: game.settings.get("arcane-artifex", "hordeCfgScale"),
      karras: game.settings.get("arcane-artifex", "hordeKarras"),
      denoising_strength: 1.0,
      tiling: false,
      hires_fix: false
    }
  };


  game.settings.set('arcane-artifex', 'hordeRequestBody', requestBody);

  try {
    const apiKey = game.settings.get('arcane-artifex', 'hordeAPIKey');
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error while generating image, status: ${response.status}`);
    }

    const data = await response.json();

    // Begin the polling process for image generation status
    await this.initProgressRequest(data.id, prompt, message);
  }
  catch (error) {
    ui.notifications.error(`Error while sending request to Horde AI: ${error.message}`);
  }
}


async initProgressRequest(generationId, prompt, message, attempt = 0, currentState = "undefined", initialDelay = 1000) {
  const maxAttempts = 100;
  const aiHordeUrl = game.settings.get('arcane-artifex', 'hordeUrl');
  let checkStatusUrl = `${aiHordeUrl}/api/v2/generate/check/${generationId}`;

  if (attempt >= maxAttempts) {
    console.error("Max progress check attempts reached, stopping further checks.");
    return;
  }

  const delay = attempt === 0 ? initialDelay : 5000;

  setTimeout(async () => {
    try {
      const statusResponse = await fetch(checkStatusUrl);
      if (!statusResponse.ok) {
        throw new Error('Request failed with status ' + statusResponse.status);
      }

      const statusData = await statusResponse.json();
      chatListener.displayHordeProgress(message, statusData);

      if (currentState === "undefined" && attempt === 0) {
        currentState = "idle";
      }

      if (!statusData.done && currentState !== "waiting") {
        currentState = "waiting";
      } else if (statusData.done && currentState !== "processing") {
        currentState = "processing";
      }

      if (!statusData.done) {
        this.initProgressRequest(generationId, prompt, message, attempt + 1, currentState);
      }

      if (statusData.done && currentState === "processing") {
        await this.retrieveGeneratedImage(generationId, prompt, message);
      }
    } catch (error) {
      if (attempt === 0) {
        // Retry the initial call with a back-off strategy
        this.initProgressRequest(generationId, prompt, message, attempt + 1, currentState, Math.min(delay * 2, 2500));
      }
    }
  }, delay);
}


    

async retrieveGeneratedImage(generationId, prompt, message) {
  const aiHordeUrl = game.settings.get('arcane-artifex', 'hordeUrl');
  const retrieveUrl = `${aiHordeUrl}/api/v2/generate/status/${generationId}`;


  // wait one second before attempting to fetch the retrieveUrl
  await new Promise(resolve => setTimeout(resolve, 5000));


  try {
    const retrieveResponse = await fetch(retrieveUrl);
    if (!retrieveResponse.ok) {
      throw new Error(`HTTP error! Status: ${retrieveResponse.status}`);
    }
    const retrieveData = await retrieveResponse.json();

    if (!retrieveData.done || !retrieveData.generations || retrieveData.generations.length === 0) {
      console.error('No image generation data found or image generation not complete.');
      return;
    }

    const imageUrl = retrieveData.generations[0].img;
    console.log('Direct URL of the generated image:', imageUrl); // Add this line
    await chatListener.fetchAndProcessImage(imageUrl, prompt, message);
  } catch (error) {
    console.error('Error during image retrieval and processing:', error);
  }
}



}

export const aiHordeApiClient = new HordeAPIClient();
export default aiHordeApiClient;
