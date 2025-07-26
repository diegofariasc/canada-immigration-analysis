let hasRenderedScene1 = false;
let selectedYear;
let tooltip;
let annotationGlobal, containerGlobal, dataGlobal, provincesGlobal;

const provinces = [
    "Newfoundland and Labrador", "Prince Edward Island", "Nova Scotia", "New Brunswick",
    "Quebec", "Ontario", "Manitoba", "Saskatchewan", "Alberta", "British Columbia",
    "Yukon", "Northwest Territories", "Nunavut"
];

function renderScene1(container, annotation, allData) {
    const data = allData.immigrationData;
    data.forEach(d => {
        d.totalImmigrants = provinces.reduce((sum, p) => sum + (+d[p] || 0), 0);
    });

    container.selectAll("*").remove();

    insertTitleAndDescription(
        container,
        "Growing Immigration in Canada",
        "Canada has consistently welcomed a growing number of immigrants since 1991, with a notable peak in <strong>2021 and 2022</strong>. The <em>Express Entry</em> system, introduced in 2015, streamlined skilled worker applications, while additional pathways—such as one that granted permanent status to temporary residents—helped attract and retain talent already in the country. This upward trend, visible in the bar chart, reflects the government's broader commitment to immigration as a key driver of economic growth"
    );

    tooltip = container.append("div")
        .style("position", "absolute")
        .style("pointer-events", "none")
        .style("background", "rgba(0,0,0,0.7)")
        .style("color", "white")
        .style("padding", "6px 10px")
        .style("border-radius", "4px")
        .style("font-size", "12px")
        .style("visibility", "hidden");

    annotationGlobal = annotation;
    containerGlobal = container;
    dataGlobal = data;
    provincesGlobal = provinces;
    selectedYear = data[data.length - 1].Year;

    drawChart();

    window.addEventListener("resize", drawChart);
}

function drawChart() {
    const container = containerGlobal;
    const data = dataGlobal;
    const annotation = annotationGlobal;

    container.select("svg")?.remove();

    const margin = { top: 0, right: 40, bottom: 60, left: 80 };
    const containerNode = container.node();
    const containerWidth = containerNode.clientWidth;
    const isWide = containerWidth > 600;

    insertFooter(container, {
        textHtml: isWide
            ? "<strong>Hover</strong> over the bar chart to see details for each year or <strong>click</strong> a bar to view the immigrant distribution by province for that year"
            : "<strong>Hover</strong> to see details for each year. Province-level data is not available on small screens.",
        sources: ["Statistics Canada, <i>Estimates of demographic growth components (annual)</i>"]
    });

    const containerHeight = containerNode.clientHeight;
    const barWidth = isWide
        ? (containerWidth * 0.6 - margin.left - margin.right - 40)
        : (containerWidth - margin.left - margin.right);
    const barHeight = containerHeight - margin.top - margin.bottom;
    const pieRadius = Math.min(containerHeight, (containerWidth - 70) * 0.3) / 3;

    const svg = container.append("svg")
        .attr("width", containerWidth)
        .attr("height", containerHeight);

    const barGroup = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const pieGroup = svg.append("g")
        .attr("transform", `translate(${isWide ? (barWidth + margin.left + pieRadius * 1.2 + 130) : containerWidth / 2},${isWide ? (margin.top + barHeight / 2) : (barHeight + margin.top + margin.bottom + pieRadius)})`);

    const x = d3.scaleBand()
        .domain(data.map(d => d.Year))
        .range([0, barWidth])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.totalImmigrants) * 1.1])
        .range([barHeight, 0]);

    barGroup.append("g")
        .attr("transform", `translate(0,${barHeight})`)
        .call(d3.axisBottom(x).tickValues(x.domain().filter((d, i) => i % 5 === 0)))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    const yAxisGroup = barGroup.append("g")
        .call(d3.axisLeft(y).tickValues(d3.range(0, d3.max(data, d => d.totalImmigrants) * 1.1 + 1, 100000)).tickFormat(d => `${(d / 1000).toLocaleString()}k`));

    barGroup.append("text")
        .attr("x", barWidth / 2)
        .attr("y", barHeight + 50)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("font-family", "system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif")
        .attr("font-weight", 500)
        .attr("fill", "#333")
        .text("Year");

    const yAxisBBox = yAxisGroup.node().getBBox();

    barGroup.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -barHeight / 2)
        .attr("y", -yAxisBBox.width - 20)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("font-family", "system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif")
        .attr("font-weight", 500)
        .attr("fill", "#333")
        .text("Total Immigrants");

    const barsGroup = barGroup.append("g");

    const barColor = "#555555";
    const barSelectedColor = "#f57c00";

    const bars = barsGroup.selectAll(".bar")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.Year))
        .attr("y", barHeight)
        .attr("width", x.bandwidth())
        .attr("height", 0)
        .attr("fill", d => d.Year === selectedYear ? barSelectedColor : barColor)
        .style("cursor", "pointer")
        .on("click", (event, d) => {
            selectedYear = d.Year;
            updateBars(bars, barColor, barSelectedColor);
            if (container.node().clientWidth >= 400) updatePieChart(pieGroup, pieRadius);
            annotation.text(`Selected Year: ${selectedYear}. Immigration totals shown in bar and distribution by province in pie chart.`);
        })
        .on("mouseover", (event, d) => {
            d3.select(event.currentTarget).attr("fill", d.Year === selectedYear ? d3.color(barSelectedColor).brighter(0.7) : d3.color(barColor).brighter(1));
            tooltip.style("visibility", "visible")
                .html(`<strong>Year:</strong> ${d.Year}<br><strong>Total immigrants:</strong> ${d.totalImmigrants.toLocaleString()}`)
                .style("top", (event.pageY - 40) + "px")
                .style("left", (event.pageX + 10) + "px");
        })
        .on("mousemove", (event) => {
            tooltip.style("top", (event.pageY - 40) + "px")
                .style("left", (event.pageX + 10) + "px");
        })
        .on("mouseout", (event, d) => {
            d3.select(event.currentTarget).attr("fill", d.Year === selectedYear ? barSelectedColor : barColor);
            tooltip.style("visibility", "hidden");
        });

    if (!hasRenderedScene1) {
        bars.transition()
            .duration(800)
            .delay((d, i) => i * 30)
            .attr("y", d => y(d.totalImmigrants))
            .attr("height", d => Math.max(0, barHeight - y(d.totalImmigrants)));
    } else {
        bars.attr("y", d => y(d.totalImmigrants))
            .attr("height", d => Math.max(0, barHeight - y(d.totalImmigrants)));
    }

    drawTrendLine(barGroup, x, y);

    if (isWide) {
        updatePieChart(pieGroup, pieRadius);
    }

    hasRenderedScene1 = true;
}

function updateBars(bars, barColor, selectedColor) {
    bars.attr("fill", d => d.Year === selectedYear ? selectedColor : barColor);
}

function drawTrendLine(group, x, y) {
    const data = dataGlobal;
    const xVals = data.map(d => d.Year);
    const yVals = data.map(d => d.totalImmigrants);
    const n = data.length;

    const sumX = d3.sum(xVals);
    const sumY = d3.sum(yVals);
    const sumXY = d3.sum(data, d => d.Year * d.totalImmigrants);
    const sumX2 = d3.sum(xVals, d => d * d);
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const trendData = [
        { Year: xVals[0], immigrants: slope * xVals[0] + intercept },
        { Year: xVals[n - 1], immigrants: slope * xVals[n - 1] + intercept }
    ];

    const line = d3.line()
        .x(d => x(d.Year) + x.bandwidth() / 2)
        .y(d => y(d.immigrants));

    const path = group.append("path")
        .datum(trendData)
        .attr("fill", "none")
        .attr("stroke", "#2196f3")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "5,5")
        .attr("d", line);

    const totalLength = path.node().getTotalLength();
    path.attr("stroke-dasharray", `${totalLength} ${totalLength}`)
        .attr("stroke-dashoffset", totalLength);

    if (!hasRenderedScene1) {
        path.transition()
            .delay(data.length * 30 + 200)
            .duration(1500)
            .ease(d3.easeCubicInOut)
            .attr("stroke-dashoffset", 0);
    } else {
        path.attr("stroke-dashoffset", 0);
    }
}

function updatePieChart(pieGroup, pieRadius) {
    const data = dataGlobal;
    const provinces = provincesGlobal;
    const color = d3.scaleOrdinal().domain(provinces).range(d3.schemeSet3);
    const pie = d3.pie().value(d => d.value).sort(null);
    const arc = d3.arc().innerRadius(0).outerRadius(pieRadius);
    const outerArc = d3.arc().innerRadius(pieRadius * 1.1).outerRadius(pieRadius * 1.1);

    const row = data.find(d => +d.Year === +selectedYear);
    const pieDataRaw = provinces.map(p => ({ province: p, value: row && row[p] ? +row[p] : 0 }));
    const total = d3.sum(pieDataRaw, d => d.value);
    const threshold = total * 0.05;

    const largeProvinces = pieDataRaw.filter(d => d.value >= threshold);
    const smallProvinces = pieDataRaw.filter(d => d.value < threshold);
    const otherValue = d3.sum(smallProvinces, d => d.value);
    const pieData = largeProvinces.slice();
    if (otherValue > 0) pieData.push({ province: "Other", value: otherValue });

    const arcs = pie(pieData);

    let linesGroup = pieGroup.select("g.lines");
    if (linesGroup.empty()) linesGroup = pieGroup.append("g").attr("class", "lines");

    let slicesGroup = pieGroup.select("g.slices");
    if (slicesGroup.empty()) slicesGroup = pieGroup.append("g").attr("class", "slices");

    let labelsGroup = pieGroup.select("g.labels");
    if (labelsGroup.empty()) labelsGroup = pieGroup.append("g").attr("class", "labels");

    linesGroup.selectAll("polyline")
        .data(arcs, d => d.data.province)
        .join(
            enter => enter.append("polyline")
                .attr("stroke", "black")
                .attr("stroke-width", 1)
                .attr("fill", "none"),
            update => update,
            exit => exit.remove()
        )
        .transition()
        .duration(600)
        .attr("points", d => {
            const posA = arc.centroid(d);
            const posB = outerArc.centroid(d);
            const posC = [...posB];
            posC[0] = (d.endAngle + d.startAngle) / 2 < Math.PI ? pieRadius * 1.3 : -pieRadius * 1.3;
            return [posA, posB, posC];
        });

    const paths = slicesGroup.selectAll("path.slice").data(arcs, d => d.data.province);

    paths.enter()
        .append("path")
        .attr("class", "slice")
        .attr("fill", d => d.data.province === "Other" ? "#999999" : color(d.data.province))
        .attr("stroke", "white")
        .attr("stroke-width", 1)
        .style("cursor", "pointer")
        .on("mouseover", (event, d) => {
            d3.select(event.currentTarget).attr("fill", d3.color(d.data.province === "Other" ? "#999999" : color(d.data.province)).darker(0.7));
            const percent = ((d.data.value / d3.sum(pieData, dd => dd.value)) * 100).toFixed(1);
            tooltip.style("visibility", "visible")
                .html(`<strong>${d.data.province}</strong><br>${d.data.value.toLocaleString()} immigrants<br>${percent}%`)
                .style("top", (event.pageY - 40) + "px")
                .style("left", (event.pageX + 10) + "px");
        })
        .on("mousemove", (event) => {
            tooltip.style("top", (event.pageY - 40) + "px")
                .style("left", (event.pageX + 10) + "px");
        })
        .on("mouseout", (event, d) => {
            d3.select(event.currentTarget).attr("fill", d.data.province === "Other" ? "#999999" : color(d.data.province));
            tooltip.style("visibility", "hidden");
        })
        .merge(paths)
        .transition()
        .duration(600)
        .attrTween("d", function (d) {
            const current = this._current || d;
            const interpolate = d3.interpolate(current, d);
            this._current = interpolate(0);
            return t => arc(interpolate(t));
        });

    paths.exit().remove();

    if (!hasRenderedScene1) {
        labelsGroup.selectAll("text")
            .data(arcs, d => d.data.province)
            .join(
                enter => enter.append("text")
                    .attr("font-size", "11px")
                    .attr("alignment-baseline", "middle")
                    .attr("fill", "#333"),
                update => update,
                exit => exit.remove()
            )
            .transition()
            .duration(600)
            .attr("transform", d => {
                const pos = outerArc.centroid(d);
                pos[0] = (d.endAngle + d.startAngle) / 2 < Math.PI ? pieRadius * 1.35 : -pieRadius * 1.35;
                return `translate(${pos[0]},${pos[1]})`;
            })
            .style("text-anchor", d => ((d.endAngle + d.startAngle) / 2 < Math.PI ? "start" : "end"))
            .text(d => d.data.province);
    } else {
        labelsGroup.selectAll("text")
            .data(arcs, d => d.data.province)
            .join(
                enter => enter.append("text")
                    .attr("font-size", "11px")
                    .attr("alignment-baseline", "middle")
                    .attr("fill", "#333"),
                update => update,
                exit => exit.remove()
            )
            .attr("transform", d => {
                const pos = outerArc.centroid(d);
                pos[0] = (d.endAngle + d.startAngle) / 2 < Math.PI ? pieRadius * 1.35 : -pieRadius * 1.35;
                return `translate(${pos[0]},${pos[1]})`;
            })
            .style("text-anchor", d => ((d.endAngle + d.startAngle) / 2 < Math.PI ? "start" : "end"))
            .text(d => d.data.province);
    }
}
