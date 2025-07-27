let scene2_hasRendered = false;
let scene2_svg, scene2_x, scene2_y, scene2_xAxis, scene2_yAxis, scene2_tooltip, scene2_checkboxContainer;
let scene2_selectedProvinces = new Set();
const scene2_visibleLines = new Map();

function scene2_render(container, annotation, allData) {
    container.html("");

    insertTitleAndDescription(
        container,
        "Housing Costs: A Growing Hurdle",
        "Canada's housing prices pose a significant challenge for new immigrants. Observe the sustained growth, with sharp increases after the <strong>2008 housing market crisis</strong>, as the recovering market saw heightened demand. The most dramatic surge, however, occurred post-<strong>COVID-19 pandemic</strong>, driven by low interest rates and increased demand for living spaces, pushing prices to unprecedented levels. This escalating cost, particularly in major urban centers where many immigrants settle, often hinders successful integration"
    );

    insertFooter(container, {
        textHtml: "Provinces preselected based on recent high migration inflows: British Columbia, Quebec, and Ontario. <strong>Toggle</strong> to compare housing price trends across different provinces. <strong>Hover</strong> to see details for each year",
        sources: ["Statistics Canada, <i>Estimates of demographic growth components (annual)</i>"]
    });

    const containerNode = container.node();
    const containerWidth = containerNode.clientWidth;
    const isWide = containerWidth > 600;
    const margin = { top: 40, right: 30 + (isWide ? 120 : 0), bottom: 40, left: 90 };

    const topProvinces = ["Ontario", "British Columbia", "Quebec"];
    const color = d3.scaleOrdinal().range(d3.schemeTableau10);

    const data = allData.housingData;
    data.forEach(d => d.Year = +d.Year);

    const provinces = Array.from(new Set(data.map(d => d.Province)))
        .filter(p => p !== "Canada")
        .sort();
    color.domain(provinces);

    const years = Array.from(new Set(data.map(d => d.Year))).sort((a, b) => a - b);
    const maxPrice = d3.max(data, d => +d.AveragePrice_CAD);
    const averageByYear = years.map(year => {
        const yearData = data.filter(d => d.Year === year && d.Province !== "Canada");
        return { year, avg: d3.mean(yearData, d => +d.AveragePrice_CAD) };
    });

    scene2_checkboxContainer = container.insert("div", ":first-child")
        .attr("id", "province-selector");

    scene2_checkboxContainer.append("span")
        .attr("id", "province-selector-title")
        .text("Select Provinces:");

    provinces.forEach(prov => {
        const id = `checkbox-${prov.replace(/\s+/g, '-')}`;
        const label = scene2_checkboxContainer.append("label")
            .style("display", "flex")
            .style("align-items", "center")
            .style("margin", "8px 0")
            .style("cursor", "pointer")
            .style("user-select", "none");

        label.append("input")
            .attr("type", "checkbox")
            .attr("id", id)
            .attr("value", prov)
            .property("checked", topProvinces.includes(prov))
            .style("margin-right", "10px");

        label.append("span")
            .style("display", "inline-block")
            .style("width", "22px")
            .style("height", "14px")
            .style("background-color", color(prov))
            .style("margin-right", "10px")
            .style("border-radius", "3px")
            .style("box-shadow", "0 0 2px rgba(0,0,0,0.2)");

        label.append("span")
            .style("white-space", "nowrap")
            .text(prov);
    });

    scene2_checkboxContainer.selectAll("input[type=checkbox]").on("change", scene2_updateLines);

    scene2_drawChart(container, margin, data, years, maxPrice, averageByYear, color, provinces, topProvinces);

    scene2_hasRendered = true;

    window.addEventListener("resize", scene2_onResize);

    annotation.text("Housing prices have increased consistently over the past two decades, with significant variations across provinces.");
}

function scene2_onResize() {
    scene2_drawChart(container, margin, data, years, maxPrice, averageByYear, color, provinces, topProvinces);
    scene2_updateLines();
}

function scene2_drawChart(container, margin, data, years, maxPrice, averageByYear, color, provinces, topProvinces) {
    container.select("svg").remove();
    scene2_visibleLines.clear();
    scene2_selectedProvinces.clear();

    const containerNode = container.node();
    const containerWidth = containerNode.clientWidth - 280;
    const containerHeight = containerNode.clientHeight;
    const isWide = containerWidth > 600;
    const width = containerWidth - margin.left - margin.right + (!isWide ? 100 : 0);
    const height = containerHeight - margin.top - margin.bottom;

    scene2_svg = container.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + 100)
        .style("font-family", "sans-serif")
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    scene2_y = d3.scaleLinear().domain([0, maxPrice * 1.1]).range([height, 0]);
    scene2_x = d3.scaleLinear().domain(d3.extent(years)).range([0, width]);

    scene2_xAxis = d3.axisBottom(scene2_x).ticks(5).tickFormat(d3.format("d"));
    scene2_yAxis = d3.axisLeft(scene2_y).ticks(6).tickFormat(d => d / 1000 + "k");

    scene2_svg.append("g").attr("class", "x-axis").attr("transform", `translate(0,${height})`).call(scene2_xAxis);
    scene2_svg.append("g").attr("class", "y-axis").call(scene2_yAxis);

    scene2_svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("font-family", "system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif")
        .attr("font-weight", 500)
        .text("Year");

    scene2_svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -60)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("font-family", "system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif")
        .attr("font-weight", 500)
        .text("Average Price (CAD)");

    const avgLine = d3.line().x(d => scene2_x(d.year)).y(d => scene2_y(d.avg));

    scene2_svg.append("path")
        .datum(averageByYear)
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", 2.5)
        .attr("stroke-dasharray", "5 5")
        .attr("class", "national-average-line")
        .attr("d", avgLine);

    const lastAvg = averageByYear[averageByYear.length - 1];

    if (isWide) {
        scene2_svg.append("text")
            .attr("x", scene2_x(lastAvg.year) + 5)
            .attr("y", scene2_y(lastAvg.avg) - 15)
            .attr("fill", "black")
            .style("font-size", "12px")
            .text("National Average");
    }

    const crisisYears = [
        { year: 2008, label: isWide ? "2008 housing market crisis" : "" },
        { year: 2020, label: isWide ? "COVID-19 pandemic" : "" }
    ];

    crisisYears.forEach(c => {
        if (c.year >= d3.min(years) && c.year <= d3.max(years)) {
            scene2_svg.append("line")
                .attr("x1", scene2_x(c.year))
                .attr("x2", scene2_x(c.year))
                .attr("y1", 0)
                .attr("y2", height)
                .attr("stroke", "gray")
                .attr("stroke-dasharray", "4 4")
                .attr("stroke-width", 1.5);

            scene2_svg.append("text")
                .attr("x", scene2_x(c.year) + 5)
                .attr("y", 15)
                .attr("fill", "gray")
                .style("font-size", "12px")
                .text(c.label);
        }
    });

    scene2_tooltip = container.select(".tooltip");
    if (scene2_tooltip.empty()) {
        scene2_tooltip = container.append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("background", "white")
            .style("border", "1px solid gray")
            .style("padding", "6px")
            .style("border-radius", "4px")
            .style("pointer-events", "none")
            .style("opacity", 0);
    }

    topProvinces.forEach(prov => {
        scene2_drawProvince(prov, data, scene2_x, scene2_y, color);
        scene2_selectedProvinces.add(prov);
    });
}

function scene2_drawProvince(prov, data, x, y, color) {
    const provData = data.filter(d => d.Province === prov).sort((a, b) => a.Year - b.Year);
    const lineGen = d3.line()
        .defined(d => d.AveragePrice_CAD != null)
        .x(d => x(d.Year))
        .y(d => y(d.AveragePrice_CAD));

    const group = scene2_svg.append("g").attr("class", "line-group").attr("data-prov", prov);

    const path = group.append("path")
        .datum(provData)
        .attr("fill", "none")
        .attr("stroke", color(prov))
        .attr("stroke-width", 2)
        .attr("opacity", 0.9)
        .attr("d", lineGen);

    const totalLength = path.node().getTotalLength();

    if (!scene2_hasRendered) {
        path.attr("stroke-dasharray", totalLength + " " + totalLength)
            .attr("stroke-dashoffset", totalLength)
            .transition().duration(1500).attr("stroke-dashoffset", 0);
    } else {
        path.attr("stroke-dasharray", totalLength + " " + totalLength)
            .attr("stroke-dashoffset", 0);
    }

    const pointsData = provData.filter(d => d.AveragePrice_CAD != null);
    const delayPerPoint = 1500 / pointsData.length;

    const circles = group.selectAll("circle")
        .data(pointsData)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.Year))
        .attr("cy", d => y(d.AveragePrice_CAD))
        .attr("r", 0)
        .attr("fill", color(prov))
        .attr("opacity", 0.9)
        .on("mouseover", (event, d) => {
            scene2_tooltip.transition().duration(200).style("opacity", 1);
            scene2_tooltip.html(`
                <strong>${d.Province}</strong><br/>
                Year: ${d.Year}<br/>
                Price: $${d.AveragePrice_CAD.toLocaleString()}
            `)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", () => {
            scene2_tooltip.transition().duration(500).style("opacity", 0);
        });

    if (!scene2_hasRendered) {
        circles.transition()
            .delay((d, i) => i * delayPerPoint)
            .duration(200)
            .attr("r", 4);
    } else {
        circles.attr("r", 4);
    }

    scene2_visibleLines.set(prov, group);
}

function scene2_removeProvince(prov) {
    if (scene2_visibleLines.has(prov)) {
        scene2_visibleLines.get(prov)
            .transition()
            .duration(500)
            .style("opacity", 0)
            .remove();
        scene2_visibleLines.delete(prov);
    }
}

function scene2_updateLines() {
    const checked = [];
    scene2_checkboxContainer.selectAll("input[type=checkbox]").each(function () {
        if (this.checked) checked.push(this.value);
    });

    checked.forEach(prov => {
        if (!scene2_selectedProvinces.has(prov)) {
            scene2_drawProvince(prov, data, scene2_x, scene2_y, color);
            scene2_selectedProvinces.add(prov);
        }
    });

    Array.from(scene2_selectedProvinces).forEach(prov => {
        if (!checked.includes(prov)) {
            scene2_removeProvince(prov);
            scene2_selectedProvinces.delete(prov);
        }
    });
}
