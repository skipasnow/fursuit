function getQueryParam(name) {
    return new URLSearchParams(window.location.search).get(name);
}

async function loadGrid() {
    const creator = getQueryParam("creator");

    if (!creator) {
        document.getElementById("grid-container").innerText = "No creator specified.";
        return;
    }

    try {
        const response = await fetch(`data/${creator}.json`);
        const json = await response.json();

        const grid = document.getElementById("grid-container");
        grid.innerHTML = "";

        json.images.forEach(url => {
            const img = document.createElement("img");
            img.src = url;
            img.loading = "lazy";
            grid.appendChild(img);
        });

    } catch (e) {
        document.getElementById("grid-container").innerText = "Could not load creator data.";
    }
}

loadGrid();
