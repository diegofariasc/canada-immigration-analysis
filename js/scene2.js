function renderScene2(container, annotation, allData) {
    container.html("");
    container.insert("h2", ":first-child").text("Rising Housing Prices Across Canada (2000-2022)");

    const margin = { top: 60, right: 240, bottom: 60, left: 90 },
        width = 720 - margin.left - margin.right,
        height = 450 - margin.top - margin.bottom;

    const svg = container.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .style("font-family", "sans-serif")
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const data = allData.housingData;
    data.forEach(d => d.Year = +d.Year);

    let provinces = Array.from(new Set(data.map(d => d.Province))).sort();
    provinces = provinces.filter(p => p !== "Canada");

    const topProvinces = ["Ontario", "British Columbia", "Quebec"];

    const color = d3.scaleOrdinal()
        .domain(provinces)
        .range(d3.schemeTableau10);

    const years = Array.from(new Set(data.map(d => d.Year))).sort((a, b) => a - b);
    const maxPrice = d3.max(data, d => +d.AveragePrice_CAD);
    const y = d3.scaleLinear()
        .domain([0, maxPrice * 1.1])
        .range([height, 0]);

    const x = d3.scaleLinear()
        .domain(d3.extent(years))
        .range([0, width]);

    const xAxis = d3.axisBottom(x).tickFormat(d3.format("d"));
    const yAxis = d3.axisLeft(y).ticks(6).tickFormat(d => d / 1000 + "k");

    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height})`)
        .call(xAxis);

    svg.append("g")
        .attr("class", "y-axis")
        .call(yAxis);

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .attr("text-anchor", "middle")
        .text("Year");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -60)
        .attr("text-anchor", "middle")
        .text("Average Price (thousands CAD)");

    const tooltip = container.append("div")
        .style("position", "absolute")
        .style("background", "white")
        .style("border", "1px solid gray")
        .style("padding", "6px")
        .style("border-radius", "4px")
        .style("pointer-events", "none")
        .style("opacity", 0);

    const checkboxContainer = container.insert("div", ":first-child")
        .style("position", "absolute")
        .style("top", margin.top + "px")
        .style("right", "20px")
        .style("width", "250px")
        .style("padding", "10px")
        .style("background", "#fafafa")
        .style("border", "1px solid #ccc")
        .style("border-radius", "5px")
        .style("font-size", "14px")
        .style("font-family", "sans-serif")
        .style("box-shadow", "0 0 5px rgba(0,0,0,0.1)")
        .style("user-select", "none");

    checkboxContainer.append("strong").text("Select Provinces:");

    provinces.forEach(prov => {
        const id = `checkbox-${prov.replace(/\s+/g, '-')}`;
        const label = checkboxContainer.append("label")
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

    checkboxContainer.append("div")
        .style("margin-top", "20px")
        .style("font-size", "13px")
        .style("color", "#555")
        .style("line-height", "1.3")
        .text("Provinces preselected based on recent high migration inflows: British Columbia, Quebec, and Ontario. Toggle to compare housing price trends across provinces");

    const averageByYear = years.map(year => {
        const yearData = data.filter(d => d.Year === year && d.Province !== "Canada");
        const avg = d3.mean(yearData, d => +d.AveragePrice_CAD);
        return { year, avg };
    });

    const avgLine = d3.line()
        .x(d => x(d.year))
        .y(d => y(d.avg));

    svg.append("path")
        .datum(averageByYear)
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", 2.5)
        .attr("stroke-dasharray", "5 5")
        .attr("class", "national-average-line")
        .attr("d", avgLine);

    const lastAvg = averageByYear[averageByYear.length - 1];
    svg.append("text")
        .attr("x", x(lastAvg.year) + 5)
        .attr("y", y(lastAvg.avg) - 15)
        .attr("fill", "black")
        .style("font-size", "12px")
        .text("National Average");

    let selectedProvinces = new Set();

    function animateLineAndPoints(path, points) {
        const totalLength = path.node().getTotalLength();

        path
            .attr("stroke-dasharray", totalLength + " " + totalLength)
            .attr("stroke-dashoffset", totalLength)
            .attr("opacity", 1)
            .transition()
            .duration(1600)
            .ease(d3.easeCubic)
            .attr("stroke-dashoffset", 0);

        points
            .style("opacity", 0)
            .transition()
            .duration(1600)
            .ease(d3.easeCubic)
            .delay((d, i) => i * (1600 / points.size()))
            .style("opacity", 1);
    }

    const crisisYears = [
        { year: 2008, label: "2008 Housing Market Crisis" },
        { year: 2020, label: "COVID-19 Pandemic Impact" }
    ];

    crisisYears.forEach(c => {
        if (c.year >= d3.min(years) && c.year <= d3.max(years)) {
            svg.append("line")
                .attr("class", "annotation")
                .attr("x1", x(c.year))
                .attr("x2", x(c.year))
                .attr("y1", 0)
                .attr("y2", height)
                .attr("stroke", "gray")
                .attr("stroke-dasharray", "4 4")
                .attr("stroke-width", 1.5);

            svg.append("text")
                .attr("class", "annotation")
                .attr("x", x(c.year) + 5)
                .attr("y", 15)
                .attr("fill", "gray")
                .style("font-size", "12px")
                .text(c.label);
        }
    });


    const visibleLines = new Map();

    function drawProvince(prov) {
        const provData = data.filter(d => d.Province === prov).sort((a, b) => a.Year - b.Year);
        const lineGen = d3.line()
            .defined(d => d.AveragePrice_CAD != null)
            .x(d => x(d.Year))
            .y(d => y(d.AveragePrice_CAD));

        // Group container for line+points
        const group = svg.append("g").attr("class", "line-group").attr("data-prov", prov);

        // Path
        const path = group.append("path")
            .datum(provData)
            .attr("fill", "none")
            .attr("stroke", color(prov))
            .attr("stroke-width", 2)
            .attr("opacity", 0.9)
            .attr("d", lineGen);

        // Animate path drawing
        const totalLength = path.node().getTotalLength();
        path
            .attr("stroke-dasharray", totalLength + " " + totalLength)
            .attr("stroke-dashoffset", totalLength)
            .transition()
            .duration(1500)
            .attr("stroke-dashoffset", 0);

        // Animate points progressively along with line
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
                tooltip.transition().duration(200).style("opacity", 1);
                tooltip.html(`
          <strong>${d.Province}</strong><br/>
          Year: ${d.Year}<br/>
          Price: $${d.AveragePrice_CAD.toLocaleString()}
        `)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", () => {
                tooltip.transition().duration(500).style("opacity", 0);
            });

        circles.transition()
            .delay((d, i) => i * delayPerPoint)
            .duration(200)
            .attr("r", 4);

        visibleLines.set(prov, group);
    }

    function removeProvince(prov) {
        if (visibleLines.has(prov)) {
            visibleLines.get(prov)
                .transition()
                .duration(500)
                .style("opacity", 0)
                .remove();
            visibleLines.delete(prov);
        }
    }

    function updateLines() {
        const checked = [];
        checkboxContainer.selectAll("input[type=checkbox]").each(function () {
            if (this.checked) checked.push(this.value);
        });

        checked.forEach(prov => {
            if (!selectedProvinces.has(prov)) {
                drawProvince(prov);
                selectedProvinces.add(prov);
            }
        });

        Array.from(selectedProvinces).forEach(prov => {
            if (!checked.includes(prov)) {
                removeProvince(prov);
                selectedProvinces.delete(prov);
            }
        });
    }

    provinces.forEach(prov => {
        if (topProvinces.includes(prov)) {
            drawProvince(prov);
            selectedProvinces.add(prov);
        }
    });

    checkboxContainer.selectAll("input[type=checkbox]").on("change", updateLines);

    container.style("padding-right", "270px");
    container.style("margin-top", "30px");

    annotation.text("Housing prices have increased consistently over the past two decades, with significant variations across provinces.");
}
