const categories = {
    topTeams: "Top Teams",
    comparableTeams: "Comparable Teams",
    ourTeams: "Our Teams",
    ourJudges: "Our Judges",
};

const LOCALSTORAGE_PREFIX = "giraffe-v1:";

const store = {
    getItem(key) {
        const result = localStorage.getItem(`${LOCALSTORAGE_PREFIX}${key}`);
        return JSON.parse(result) ?? [];
    },
    setItem(key, value) {
        if (!Array.isArray(value)) {
            console.error("pass an array");
        } else {
            localStorage.setItem(
                `${LOCALSTORAGE_PREFIX}${key}`,
                JSON.stringify(value)
            );
        }
    },
};

const resetAll = () => {
    for (const key in categories) {
        store.setItem(key, []);
    }
    init();
};

const createBookmarklet = ({
    topTeams,
    comparableTeams,
    ourTeams,
    ourJudges,
}) => `(function () {
  createRegex = (xs) => Array.isArray(xs) && xs.length > 0 ? new RegExp(xs.join("|"), "i") : undefined;
  highlight = {
    topTeams: {
      color: "#ff9c9c",
      re: createRegex(${JSON.stringify(topTeams)}),
    },
    comparableTeams: {
      color: "#ffc1c1",
      re: createRegex(${JSON.stringify(comparableTeams)}),
    },
    ourTeams: {
      color: "#3fd2ff",
      re: createRegex(${JSON.stringify(ourTeams)}),
    },
    ourJudges: {
      color: "#5fe35f",
      re: createRegex(${JSON.stringify(ourJudges)}),
    },
  };
  for (const cell of document.querySelectorAll(
    ".main table > tbody > tr[role='row'] > td"
  )) {
    const result = Object.entries(highlight).find(([fmt, { re }]) =>
      re && cell.textContent.match(re)
    );
    if (result) {
      const [fmt, { color }] = result;
      cell.style.fontWeight = "bold";
      cell.style.backgroundColor = color;
      cell.setAttribute("data-notable-round", fmt);
    }
 }
  for (const r of [
    ...document.querySelectorAll(".main table > tbody > tr[role='row']"),
  ].filter((r) => r.querySelector("td[data-notable-round]") === null)) {
    r.style.display = "none";
  }
})();`;

function getCategoryColorClass(category) {
    switch(category) {
        case 'topTeams': return 'bg-red-200';
        case 'comparableTeams': return 'bg-pink-200';
        case 'ourTeams': return 'bg-blue-200';
        case 'ourJudges': return 'bg-green-200';
        default: return 'bg-gray-200';
    }
}

function addItemToList(category, item) {
    const listElement = document.querySelector(`#${category} ul`);
    const template = document.getElementById('list-item-template');
    const listItem = template.content.cloneNode(true).querySelector('li');
    
    listItem.querySelector('span').textContent = item;
    listItem.setAttribute('data-item', item);
    
    listItem.classList.add(getCategoryColorClass(category));

    const removeButton = listItem.querySelector('button');
    removeButton.addEventListener('click', () => removeItem(category, item));

    listElement.appendChild(listItem);
}

function addItem(category) {
    const input = document.querySelector(`#${category} input`);
    const item = input.value.trim();
    if (item) {
        const existing = new Set(store.getItem(category));
        existing.add(item);

        store.setItem(category, Array.from(existing));
        addItemToList(category, item);
        input.value = "";
    }
}

function removeItem(category, item) {
    const existing = new Set(store.getItem(category));
    existing.delete(item);
    store.setItem(category, Array.from(existing));
    const listElements = document.querySelectorAll(
        `#${category} ul li[data-item="${item}"]`
    );
    for (const el of listElements) {
        el.parentNode.removeChild(el);
    }
}

function generateBookmarklet() {
    const updatedData = Object.keys(categories).reduce(
        (acc, curr) => ({
            ...acc,
            [curr]: store.getItem(curr),
        }),
        {}
    );

    const newBookmarkletCode = createBookmarklet(updatedData);
    const outputElement = document.getElementById("bookmarklet-output");
    outputElement.href = "javascript:" + encodeURIComponent(newBookmarkletCode);
    outputElement.innerText = "Highlight Teams";
}

function init() {
    const container = document.getElementById("categories");
    container.innerHTML = ''; // Clear existing categories
    Object.keys(categories).forEach((key) => {
        const category = categories[key];
        const template = document.getElementById('category-template');
        const div = template.content.cloneNode(true).querySelector('div');
        div.id = key;
        div.querySelector('h2').textContent = category;
        container.appendChild(div);

        const addButton = div.querySelector("button");
        addButton.addEventListener("click", () => addItem(key));

        const items = store.getItem(key);
        for (const item of items) {
            addItemToList(key, item);
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    init();

    document.getElementById("reset").addEventListener("click", resetAll);
    document.getElementById("generate-bookmarklet").addEventListener("click", generateBookmarklet);
});
