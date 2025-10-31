// === НАСТРОЙКИ ===
const username = "Roman-git-hub";
const repo = "vibeplan";
const filename = "data.json";
const token = localStorage.getItem("github_token") || ""; // можно один раз ввести и сохранить

// === ФУНКЦИИ РАБОТЫ С ДАННЫМИ ===

async function loadData() {
  try {
    const response = await fetch(`https://api.github.com/repos/${username}/${repo}/contents/${filename}`, {
      headers: { Authorization: `token ${token}` }
    });

    if (!response.ok) throw new Error("Не удалось загрузить data.json");

    const json = await response.json();
    const content = JSON.parse(atob(json.content));

    // Приводим структуру к единому виду
    for (const date in content) {
      if (Array.isArray(content[date])) {
        content[date] = { ideas: content[date] };
      } else if (!content[date].ideas) {
        content[date].ideas = [];
      }
    }

    localStorage.setItem("ideas", JSON.stringify(content));
    render();
    console.log("✅ Данные успешно загружены");
  } catch (err) {
    console.error("Ошибка загрузки данных:", err);
  }
}

async function saveData() {
  try {
    const content = JSON.parse(localStorage.getItem("ideas") || "{}");

    // Убедимся, что у каждой даты есть объект ideas
    for (const date in content) {
      if (!content[date].ideas) content[date] = { ideas: [] };
    }

    const base64 = btoa(unescape(encodeURIComponent(JSON.stringify(content, null, 2))));

    const getResp = await fetch(`https://api.github.com/repos/${username}/${repo}/contents/${filename}`, {
      headers: { Authorization: `token ${token}` }
    });
    const fileData = await getResp.json();

    const putResp = await fetch(`https://api.github.com/repos/${username}/${repo}/contents/${filename}`, {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: "Sync data.json from app",
        content: base64,
        sha: fileData.sha
      })
    });

    if (!putResp.ok) throw new Error("Ошибка при сохранении на GitHub");

    console.log("✅ Данные синхронизированы с GitHub");
  } catch (err) {
    console.error("Ошибка синхронизации:", err);
  }
}

// === UI ===

function render() {
  const container = document.getElementById("ideasContainer");
  const data = JSON.parse(localStorage.getItem("ideas") || "{}");
  const today = new Date().toISOString().split("T")[0];

  container.innerHTML = "";

  const section = document.createElement("div");
  section.className = "day-section";

  const title = document.createElement("h2");
  title.textContent = today;
  section.appendChild(title);

  const addBtn = document.createElement("button");
  addBtn.textContent = "➕ Добавить идею";
  addBtn.onclick = () => addIdea(today);
  section.appendChild(addBtn);

  const list = document.createElement("div");
  list.className = "ideas-list";

  const dayData = data[today]?.ideas || [];
  dayData.forEach((idea, i) => {
    const item = document.createElement("div");
    item.className = "idea-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = idea.checked;
    checkbox.onchange = () => {
      idea.checked = checkbox.checked;
      data[today].ideas = dayData;
      localStorage.setItem("ideas", JSON.stringify(data));
      saveData();
    };

    const text = document.createElement("span");
    text.textContent = idea.text;
    if (idea.checked) text.style.textDecoration = "line-through";

    item.appendChild(checkbox);
    item.appendChild(text);
    list.appendChild(item);
  });

  section.appendChild(list);
  container.appendChild(section);
}

function addIdea(date) {
  const text = prompt("Введите текст идеи:");
  if (!text) return;

  const data = JSON.parse(localStorage.getItem("ideas") || "{}");
  if (!data[date]) data[date] = { ideas: [] };

  data[date].ideas.push({ text, checked: false });
  localStorage.setItem("ideas", JSON.stringify(data));
  render();
  saveData();
}

// === КНОПКИ ===

document.getElementById("btnSync").addEventListener("click", saveData);
document.getElementById("btnLoad").addEventListener("click", loadData);

// === ПЕРВОНАЧАЛЬНАЯ ОТРИСОВКА ===
window.addEventListener("DOMContentLoaded", render);
