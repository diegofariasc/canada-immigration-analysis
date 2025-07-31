let currentSceneIndex = 0;
let savedAllData = null;

const container = d3.select("#scene-container");
const annotation = d3.select("#annotation");
const prevBtn = d3.select("#prev-btn");
const nextBtn = d3.select("#next-btn");
const startBtn = d3.select("#start-btn");
const backToIntroBtn = d3.select("#back-to-intro-btn");
const introWrapper = d3.select("#intro-content-wrapper");
const vizWrapper = d3.select("#visualization-content-wrapper");

const sceneButtons = [
    d3.select("#scene-1-btn"),
    d3.select("#scene-2-btn"),
    d3.select("#scene-3-btn"),
    d3.select("#scene-4-btn")
];

function loadScene(index, allData) {
    scene1_hasRendered = false;
    scene2_hasRendered = false;
    scene3_hasRendered = false;
    scene4_hasRendered = false;

    window.removeEventListener("resize", scene1_debouncedRedraw);
    window.removeEventListener("resize", scene2_debouncedRedraw);
    window.removeEventListener("resize", scene3_debouncedRedraw);
    window.removeEventListener("resize", scene4_debouncedRedraw);

    container.selectAll("svg").remove();
    container.selectAll("div.chart").remove();
    container.selectAll("*:not(h2)").remove();
    annotation.text("");

    currentSceneIndex = index;

    const sceneFunction = window[`scene${index + 1}_render`];
    if (typeof sceneFunction === "function") {
        sceneFunction(container, annotation, allData);
    } else {
        console.error(`scene${index + 1}_render is not defined`);
    }

    prevBtn.property("disabled", currentSceneIndex === 0);
    nextBtn.property("disabled", currentSceneIndex === 3);
    sceneButtons.forEach((btn, i) => btn.property("disabled", i === currentSceneIndex));
}

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

    const filteredFeatures = provinces.features
        .map(filterPolygonsByLat)
        .filter(f => f !== null && f.geometry.coordinates.length > 0);

    const filteredProvinces = {
        type: "FeatureCollection",
        features: filteredFeatures
    };

    savedAllData = {
        immigrationData,
        housingData,
        unemploymentData,
        healthData,
        provinces: filteredProvinces
    };

}).catch(err => {
    console.error("Error loading data:", err);
});

startBtn.on("click", async () => {
    introWrapper.style("display", "none");
    vizWrapper.style("display", "flex");
    vizWrapper.attr("class", "content-wrapper appear-from-right");

    requestAnimationFrame(async () => {
        if (typeof loadScene === 'function' && savedAllData) {
            loadScene(0, savedAllData);
            await waitMs(500);
            vizWrapper.attr("class", "content-wrapper visible");
        }
    });
});

backToIntroBtn.on("click", async () => {
    vizWrapper.attr("class", "content-wrapper disappear-at-center");
    await waitMs(250);

    vizWrapper.style("display", "none");
    introWrapper.style("display", "flex");
    currentSceneIndex = 0;
});

prevBtn.on("click", async () => {
    vizWrapper.attr("class", "content-wrapper disappear-to-right");
    await waitMs(250);

    vizWrapper.attr("class", "content-wrapper appear-from-left");

    if (currentSceneIndex > 0) {
        loadScene(currentSceneIndex - 1, savedAllData);
        await waitMs(500)
        vizWrapper.attr("class", "content-wrapper visible");
    }
});

nextBtn.on("click", async () => {
    vizWrapper.attr("class", "content-wrapper disappear-to-left");
    await waitMs(250);

    vizWrapper.attr("class", "content-wrapper appear-from-right");

    if (currentSceneIndex < 3) {
        loadScene(currentSceneIndex + 1, savedAllData);
        await waitMs(500)
        vizWrapper.attr("class", "content-wrapper visible");
    }
});

sceneButtons.forEach((btn, index) => {
    btn.on("click", async () => {
        if (index === currentSceneIndex || !savedAllData) return;
        sceneButtons.forEach((b, i) => b.property("disabled", i === index));

        const isForward = index > currentSceneIndex;
        const exitClass = isForward ? "disappear-to-left" : "disappear-to-right";
        const enterClass = isForward ? "appear-from-right" : "appear-from-left";

        vizWrapper.attr("class", `content-wrapper ${exitClass}`);
        await waitMs(250);

        vizWrapper.attr("class", `content-wrapper ${enterClass}`);
        loadScene(index, savedAllData);
        await waitMs(500);
        vizWrapper.attr("class", "content-wrapper visible");
    });
});