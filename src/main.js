const { invoke } = window.__TAURI__.core;
const { check } = window.__TAURI__.updater;
const { relaunch } = window.__TAURI__.process;

let greetInputEl;
let greetMsgEl;

async function greet() {
  // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
  greetMsgEl.textContent = await invoke("greet", { name: greetInputEl.value });
}

async function checkForUpdates() {
  try {
    const update = await check();
    if (update?.available) {
      console.log(`Update to ${update.version} available!`);
      console.log(`Release notes: ${update.body}`);
      
      // Ask user if they want to install the update
      const shouldUpdate = confirm(
        `发现新版本 ${update.version}!\n\n更新内容:\n${update.body}\n\n是否立即更新?`
      );
      
      if (shouldUpdate) {
        console.log('Downloading and installing update...');
        await update.downloadAndInstall();
        
        // Restart the app after update
        await relaunch();
      }
    } else {
      console.log('No updates available');
    }
  } catch (error) {
    console.error('Failed to check for updates:', error);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  greetInputEl = document.querySelector("#greet-input");
  greetMsgEl = document.querySelector("#greet-msg");
  document.querySelector("#greet-form").addEventListener("submit", (e) => {
    e.preventDefault();
    greet();
  });
  
  // Check for updates on app start
  checkForUpdates();
});
