let currentSceneIndex = 0;

const container = d3.select("#scene-container");
const annotation = d3.select("#annotation");
const prevBtn = d3.select("#prev-btn");
const nextBtn = d3.select("#next-btn");

function loadScene(index, allData) {
    container.selectAll("svg").remove();
    container.selectAll("div.chart").remove();
    container.selectAll("*:not(h2)").remove();
    annotation.text("");

    currentSceneIndex = index;

    const sceneFunction = window[`renderScene${index + 1}`];
    if (typeof sceneFunction === "function") {
        sceneFunction(container, annotation, allData);
    } else {
        console.error(`renderScene${index + 1} is not defined`);
    }

    prevBtn.property("disabled", currentSceneIndex === 0);
    nextBtn.property("disabled", currentSceneIndex === 4);
}

// Load all data first
Promise.all([
    d3.csv("data/new-immigrants.csv"),
    d3.csv("data/house-prices.csv"),
    d3.csv("data/unemployment.csv"),
    d3.csv("data/health-needs.csv"),
    d3.json("data/canada-provinces.json")
]).then(([immigrationData, housingData, unemploymentData, healthData, provinces]) => {


    immigrationData.forEach(d => {
        d.year = +d.year;
        d["new immigrants"] = +d["new immigrants"];
    });

    housingData.forEach(d => {
        d.Year = +d.Year;
        d.AveragePrice_CAD = +d.AveragePrice_CAD;
    });

    unemploymentData.forEach(d => {
        d["Unemployment rate"] = +d["Unemployment rate"];
        d["Number of immigrants"] = +d["Number of immigrants"];
    });

    healthData.forEach(d => {
        d["unmet needs percentage"] = +d["unmet needs percentage"];
    });

    const allData = {
        immigrationData,
        housingData,
        unemploymentData,
        healthData,
        provinces
    };

    loadScene(currentSceneIndex, allData);

    // Button listeners
    prevBtn.on("click", () => {
        if (currentSceneIndex > 0) {
            loadScene(currentSceneIndex - 1, allData);
        }
    });

    nextBtn.on("click", () => {
        if (currentSceneIndex < 4) {
            loadScene(currentSceneIndex + 1, allData);
        }
    });
}).catch(err => {
    console.error("Error loading data:", err);
});

