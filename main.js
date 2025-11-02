
// main.js — полная версия с синхронизацией с GitHub Gist

const GIST_ID = "ВАШ_GIST_ID";
const GIST_TOKEN = "ВАШ_GITHUB_TOKEN";
const FILE_NAME = "data.json";

async function loadFromGist() {
    try {
        const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
            headers: { Authorization: `token ${GIST_TOKEN}` }
        });
        const gist = await response.json();
        const content = gist.files[FILE_NAME]?.content;
        if (content) {
            localStorage.setItem("plannerData", content);
            render();
        }
    } catch (err) {
        console.error("Ошибка загрузки данных:", err);
    }
}

async function saveToGist() {
    try {
        const data = localStorage.getItem("plannerData") || "{}";
        await fetch(`https://api.github.com/gists/${GIST_ID}`, {
            method: "PATCH",
            headers: {
                Authorization: `token ${GIST_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                files: { [FILE_NAME]: { content: data } }
            }),
        });
        alert("✅ Синхронизировано с GitHub!");
    } catch (err) {
        console.error("Ошибка синхронизации:", err);
    }
}

function render() {
    const container = document.getElementById("days");
    const data = JSON.parse(localStorage.getItem("plannerData") || "{}");
    container.innerHTML = "";

    Object.keys(data).forEach(day => {
        const div = document.createElement("div");
        div.className = "day";
        div.innerHTML = `<h3>${day}</h3>`;

        data[day].forEach((task, i) => {
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = task.done;
            checkbox.onchange = () => {
                task.done = checkbox.checked;
                localStorage.setItem("plannerData", JSON.stringify(data));
            };

            const label = document.createElement("label");
            label.textContent = task.text;

            div.appendChild(checkbox);
            div.appendChild(label);
            div.appendChild(document.createElement("br"));
        });

        container.appendChild(div);
    });
}

document.getElementById("syncBtn").addEventListener("click", saveToGist);
document.getElementById("loadBtn").addEventListener("click", loadFromGist);

render();
