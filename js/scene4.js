function renderScene4(container, annotation, allData) {
    const data = allData.healthData;
    const geoData = allData.provinces; // Ya es FeatureCollection (GeoJSON)

    container.selectAll("*").remove();
    container.insert("h2", ":first-child").text("Unmet Health Needs Across Canadian Provinces");

    const width = 800;
    const height = 500;

    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height);

    const projection = d3.geoMercator()
        .center([-100, 62])
        .scale(500)
        .translate([width / 2, height / 2]);

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

    const color = d3.scaleSequential()
        .interpolator(d3.interpolateOrRd)
        .domain([0, d3.max(data, d => d["unmet needs percentage"])]);

    const valueMap = {};
    data.forEach(d => {
        valueMap[d.province.toLowerCase()] = d["unmet needs percentage"];
    });

    svg.selectAll("path")
        .data(geoData.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("fill", d => {
            const name = d.properties.name?.toLowerCase();
            const val = valueMap[name];
            return val != null ? color(val) : "#ccc";
        })
        .attr("stroke", "#fff")
        .attr("stroke-width", 1)
        .style("opacity", 0)
        .on("mouseover", function (event, d) {
            const name = d.properties.name;
            const val = valueMap[name?.toLowerCase()];
            d3.select(this).attr("stroke", "#000");
            tooltip.style("visibility", "visible")
                .html(`<strong>${name}</strong><br>${val != null ? `${val}% unmet needs` : "No data"}`);
        })
        .on("mousemove", event => {
            tooltip.style("top", (event.pageY - 40) + "px")
                .style("left", (event.pageX + 10) + "px");
        })
        .on("mouseout", function () {
            d3.select(this).attr("stroke", "#fff");
            tooltip.style("visibility", "hidden");
        })
        .transition()
        .duration(1000)
        .style("opacity", 1);

    // Color legend
    const legendWidth = 200;
    const legendHeight = 10;

    const legendSvg = svg.append("g")
        .attr("transform", `translate(${width - legendWidth - 60},${height - 50})`);

    const defs = legendSvg.append("defs");
    const linearGradient = defs.append("linearGradient")
        .attr("id", "legend-gradient");

    linearGradient.selectAll("stop")
        .data(d3.range(0, 1.01, 0.01))
        .enter()
        .append("stop")
        .attr("offset", d => `${d * 100}%`)
        .attr("stop-color", d => color(d * d3.max(data, d => d["unmet needs percentage"])));

    legendSvg.append("rect")
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#legend-gradient)");

    const legendScale = d3.scaleLinear()
        .domain(color.domain())
        .range([0, legendWidth]);

    legendSvg.append("g")
        .attr("transform", `translate(0,${legendHeight})`)
        .call(d3.axisBottom(legendScale).ticks(5).tickFormat(d => d + "%"));

    legendSvg.append("text")
        .attr("x", 0)
        .attr("y", -10)
        .attr("font-size", "12px")
        .text("Unmet Health Needs (%)");

    annotation.text("This choropleth map shows the percentage of unmet healthcare needs across provinces. Darker shades indicate a higher percentage. PEI and Nova Scotia lead in reported unmet healthcare access.");
}
