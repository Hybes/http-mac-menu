let saveConfig = document.getElementById('saveConfig');
let cancel = document.getElementById('cancel');
let clearConfig1 = document.getElementById('clearConfig1');
let clearConfig2 = document.getElementById('clearConfig2');
let clearConfig3 = document.getElementById('clearConfig3');

const clearForm = (configNumber) => {
  let form = document.querySelector(
    `form[data-config-number="${configNumber}"]`
  );
  let inputs = form.querySelectorAll('input[type=text], textarea');
  inputs.forEach((input) => {
    input.value = '';
  });
};

let config = null;

const save = async () => {
  let inputs = document.forms['config'].querySelectorAll('input, textarea');

  for (const input of inputs) {
    config[input.id] = input.value;
  }

  // Update the timer setting for the specific configuration
  await settings.set(
    `timer${config['data-config-number']}`,
    config[`timer${config['data-config-number']}`]
  );

  awa;

  await api.saveConfig(config);
  api.exit();
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

clearConfig1?.addEventListener('click', () => clearForm('1'));
clearConfig2?.addEventListener('click', () => clearForm('2'));
clearConfig3?.addEventListener('click', () => clearForm('3'));

window.addEventListener('DOMContentLoaded', loadConfig);

saveConfig.onclick = async () => {
  await save();
};
