let scene4_container;
let scene4_annotation;
let scene4_data;
let scene4_hasRendered = false;

function scene4_updateChart() {
    scene4_renderScene(scene4_container, scene4_annotation, scene4_data);
    scene4_hasRendered = true;
}

function scene4_render(container, annotation, allData) {
    scene4_container = container;
    scene4_annotation = annotation;
    scene4_data = allData;

    requestIdleCallback(scene4_updateChart, { timeout: 1000 });
    window.addEventListener("resize", scene4_updateChart);
}

function scene4_renderScene(container, annotation, allData) {
    const data = allData.healthData;
    const geoData = allData.provinces;

    insertTitleAndDescription(
        container,
        "Newcomers in Search of Care",
        "Upon landing, newcomers will often face healthcare access issues. In 2023, almost <strong>23% of immigrants</strong> with under 10 years in Canada lacked a regular health provider. Notably, in top destinations like <strong>Ontario (8.5%)</strong> and <strong>British Columbia (10.0%)</strong>, immigrants typically encounter significant unmet needs. The choropleth map highlights provincial differences, revealing where newcomers face the greatest access gaps"
    );

    insertFooter(container, {
        textHtml: "<strong>Hover</strong> to see details for every province.",
        sources: ["Statistics Canada, <i>Employment and unemployment rate, monthly, unadjusted for seasonality</i>", "Statistics Canada, <i>Estimates of demographic growth components (annual)</i>"]
    });

    container.selectAll("*").remove();

    const containerNode = container.node();
    const width = containerNode.clientWidth;
    const height = containerNode.clientHeight;

    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height)
        .style("overflow", "visible");

    const projection = d3.geoMercator()
        .fitSize([width, height], geoData);

    const path = d3.geoPath().projection(projection);

    const tooltip = container.append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("pointer-events", "none")
        .style("background", "rgba(0,0,0,0.8)")
        .style("color", "#fff")
        .style("padding", "6px 10px")
        .style("border-radius", "4px")
        .style("font-size", "12px")
        .style("visibility", "hidden");

    const maxVal = d3.max(data, d => d["unmet needs percentage"]);
    const color = d3.scaleLinear()
        .domain([0, maxVal * 0.5, maxVal])
        .range([
            "#3a7d44",
            "#f2c14e",
            "#d94f4f"
        ]);

    const valueMap = {};
    data.forEach(d => {
        valueMap[d.province.toLowerCase()] = d["unmet needs percentage"];
    });

    if (!scene4_hasRendered) {
        svg.selectAll("path")
            .data(geoData.features)
            .enter()
            .append("path")
            .attr("class", "animated-map-path")
            .attr("d", path)
            .attr("stroke", "#fff")
            .attr("stroke-width", 1)
            .attr("fill", "#ccc")
            .transition()
            .duration(500)
            .attr("fill", d => {
                const name = d.properties.name?.toLowerCase();
                const val = valueMap[name];
                return val != null ? color(val) : "#ccc";
            });
    } else {
        svg.selectAll("path")
            .data(geoData.features)
            .enter()
            .append("path")
            .attr("d", path)
            .attr("stroke", "#fff")
            .attr("stroke-width", 1)
            .attr("fill", "#ccc")
            .attr("fill", d => {
                const name = d.properties.name?.toLowerCase();
                const val = valueMap[name];
                return val != null ? color(val) : "#ccc";
            });
    }


    const legendWidth = 20;
    const legendHeight = 150;
    const legendMargin = 40;

    const legendSvg = svg.append("g")
        .attr("transform", `translate(${width - legendMargin},${(height - legendHeight) / 2})`);

    const defs = svg.append("defs");

    const linearGradient = defs.append("linearGradient")
        .attr("id", "legend-gradient")
        .attr("x1", "0%").attr("y1", "100%")
        .attr("x2", "0%").attr("y2", "0%");

    linearGradient.selectAll("stop")
        .data([0, 0.5, 1])
        .enter()
        .append("stop")
        .attr("offset", d => `${d * 100}%`)
        .attr("stop-color", d => color(d * maxVal));

    legendSvg.append("rect")
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#legend-gradient)")
        .style("stroke", "#ccc")
        .style("stroke-width", 1);

    const legendScale = d3.scaleLinear()
        .domain([0, maxVal])
        .range([legendHeight, 0]);

    const legendAxis = d3.axisRight(legendScale)
        .ticks(5)
        .tickFormat(d => d + "%");

    legendSvg.append("g")
        .attr("transform", `translate(${legendWidth}, 0)`)
        .call(legendAxis);

    legendSvg.append("text")
        .attr("x", -legendMargin / 2)
        .attr("y", legendHeight / 2)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("transform", `rotate(-90,${-legendMargin / 2},${legendHeight / 2})`)
        .text("Unmet Health Needs (%)");
}
