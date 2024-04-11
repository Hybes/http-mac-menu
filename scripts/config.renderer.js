let saveConfig = document.getElementById('saveConfig');
let cancel = document.getElementById('cancel');
let clearConfig1 = document.getElementById('clearConfig1');
let clearConfig2 = document.getElementById('clearConfig2');
let clearConfig3 = document.getElementById('clearConfig3');
let saveConfig1 = document.getElementById('saveConfig1');
let saveConfig2 = document.getElementById('saveConfig2');
let saveConfig3 = document.getElementById('saveConfig3');

const clear = (formId) => {
  try {
    let form = document.getElementById(`form${formId}`);
    let inputs = form.querySelectorAll('input[type=text], textarea');

    for (const input of inputs) {
      input.value = '';
    }
  } catch (error) {
    console.error('Error clearing configuration:', error);
  }
};

let config = null;

const save = async (formId) => {
  try {
    if (!config) config = {};
    let form = document.getElementById(`form${formId}`);
    let inputs = form.querySelectorAll('input, textarea');

    for (const input of inputs) {
      config[input.id] = input.value;
    }
  } catch (error) {
    console.error('Error saving configuration:', error);
  }
};

const exit = async () => {
  await api.exit();
};

const loadConfig = async () => {
  config = await api.loadConfig();

  for (const setting in config) {
    let el = document.getElementById(setting);

    if (el) el.value = config[setting];
  }
};

clearConfig1?.addEventListener('click', () => clear('1'));
clearConfig2?.addEventListener('click', () => clear('2'));
clearConfig3?.addEventListener('click', () => clear('3'));

window.addEventListener('DOMContentLoaded', loadConfig);

saveConfig1?.addEventListener('click', async () => {
  await save('1');
  await api.saveConfig(config);
});

saveConfig2?.addEventListener('click', async () => {
  await save('2');
  await api.saveConfig(config);
});

saveConfig3?.addEventListener('click', async () => {
  await save('3');
  await api.saveConfig(config);
});
