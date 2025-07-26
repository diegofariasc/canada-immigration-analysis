function renderScene1(container, annotation, allData) {
    const data = allData.immigrationData;

    const provinces = [
        "Newfoundland and Labrador", "Prince Edward Island", "Nova Scotia", "New Brunswick",
        "Quebec", "Ontario", "Manitoba", "Saskatchewan", "Alberta", "British Columbia",
        "Yukon", "Northwest Territories", "Nunavut"
    ];

    container.selectAll("*").remove();

    insertTitleAndDescription(
        container,
        "Growing Immigration in Canada",
        "Canada has consistently welcomed a growing number of immigrants since 1991, with a notable peak in <strong>2021 and 2022</strong>. The <em>Express Entry</em> system, introduced in 2015, streamlined skilled worker applications, while additional pathways—such as one that granted permanent status to temporary residents—helped attract and retain talent already in the country. This upward trend, visible in the bar chart, reflects the government's broader commitment to immigration as a key driver of economic growth"
    );


    const margin = { top: 60, right: 40, bottom: 80, left: 80 };
    const width = 900 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    const barWidth = width * 0.6;
    const pieX = barWidth + 270;

    const svg = container.append("svg")
        .attr("width", width + margin.left + margin.right + 250)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const tooltip = container.append("div")
        .style("position", "absolute")
        .style("pointer-events", "none")
        .style("background", "rgba(0,0,0,0.7)")
        .style("color", "white")
        .style("padding", "6px 10px")
        .style("border-radius", "4px")
        .style("font-size", "12px")
        .style("visibility", "hidden");

    data.forEach(d => {
        d.totalImmigrants = provinces.reduce((sum, p) => sum + (+d[p] || 0), 0);
    });

    const x = d3.scaleBand()
        .domain(data.map(d => d.Year))
        .range([0, barWidth])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.totalImmigrants) * 1.1])
        .range([height, 0]);

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickValues(x.domain().filter((d, i) => i % 5 === 0)))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    svg.append("g")
        .call(d3.axisLeft(y).tickFormat(d => (d / 1000).toLocaleString()));

    const barsGroup = svg.append("g");

    let selectedYear = data[data.length - 1].Year;

    const barColor = "#555555";
    const barSelectedColor = "#f57c00";

    barsGroup.selectAll(".bar")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.Year))
        .attr("y", height)
        .attr("width", x.bandwidth())
        .attr("height", 0)
        .attr("fill", d => d.Year === selectedYear ? barSelectedColor : barColor)
        .style("cursor", "pointer")
        .on("click", (event, d) => {
            selectedYear = d.Year;
            updateBars();
            updatePieChart(selectedYear);
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
        })
        .transition()
        .duration(800)
        .delay((d, i) => i * 30)
        .attr("y", d => y(d.totalImmigrants))
        .attr("height", d => height - y(d.totalImmigrants));

    function updateBars() {
        barsGroup.selectAll(".bar")
            .attr("fill", d => d.Year === selectedYear ? barSelectedColor : barColor);
    }

    svg.append("text")
        .attr("x", barWidth / 2)
        .attr("y", height + 65)
        .attr("text-anchor", "middle")
        .attr("font-size", "14px")
        .text("Year");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -60)
        .attr("x", -height / 2)
        .attr("text-anchor", "middle")
        .attr("font-size", "14px")
        .text("New immigrants (thousands)");

    const xVals = data.map(d => d.Year);
    const yVals = data.map(d => d.totalImmigrants);
    const n = data.length;
    const sumX = d3.sum(xVals), sumY = d3.sum(yVals);
    const sumXY = d3.sum(data, d => d.Year * d.totalImmigrants);
    const sumX2 = d3.sum(xVals, d => d * d);
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const trendData = [
        { Year: xVals[0], immigrants: slope * xVals[0] + intercept },
        { Year: xVals[n - 1], immigrants: slope * xVals[n - 1] + intercept }
    ];

    const trendLine = d3.line()
        .x(d => x(d.Year) + x.bandwidth() / 2)
        .y(d => y(d.immigrants));

    const trendPath = svg.append("path")
        .datum(trendData)
        .attr("fill", "none")
        .attr("stroke", "#2196f3")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "5,5")
        .attr("d", trendLine);

    const totalLength = trendPath.node().getTotalLength();
    trendPath
        .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .delay(data.length * 30 + 200)
        .duration(1500)
        .ease(d3.easeCubicInOut)
        .attr("stroke-dashoffset", 0);

    svg.append("rect")
        .attr("x", barWidth - 130)
        .attr("y", -45)
        .attr("width", 20)
        .attr("height", 4)
        .attr("fill", "#2196f3")
        .attr("stroke-dasharray", "5,5")
        .attr("stroke", "#2196f3");

    svg.append("text")
        .attr("x", barWidth - 100)
        .attr("y", -40)
        .attr("font-size", "12px")
        .text("Trendline (growth)");

    svg.append("text")
        .attr("x", barWidth / 2)
        .attr("y", -20)
        .attr("text-anchor", "middle")
        .attr("font-size", "13px")
        .attr("fill", "#333")
        .text("Select a year in the bar chart to see immigration distribution by province");

    const pieGroup = svg.append("g")
        .attr("transform", `translate(${pieX},${height / 2})`);

    const radius = 110;
    const color = d3.scaleOrdinal().domain(provinces).range(d3.schemeSet3);
    const pie = d3.pie().value(d => d.value).sort(null);
    const arc = d3.arc().innerRadius(0).outerRadius(radius);
    const outerArc = d3.arc().innerRadius(radius * 1.1).outerRadius(radius * 1.1);

    let polylineGroup = pieGroup.append("g").attr("class", "lines");
    let labelGroup = pieGroup.append("g").attr("class", "labels");

    function updatePieChart(year) {
        svg.selectAll(".pie-chart-title").remove();
        svg.selectAll(".tooltip-legend").remove();

        const row = data.find(d => +d.Year === +year);

        let pieDataRaw = provinces.map(p => ({
            province: p,
            value: row && row[p] ? +row[p] : 0
        }));

        const total = d3.sum(pieDataRaw, d => d.value);
        const threshold = total * 0.05;

        const largeProvinces = pieDataRaw.filter(d => d.value >= threshold);
        const smallProvinces = pieDataRaw.filter(d => d.value < threshold);
        const otherValue = d3.sum(smallProvinces, d => d.value);
        const pieData = largeProvinces.slice();

        if (otherValue > 0) {
            pieData.push({ province: "Other", value: otherValue });
        }

        const arcs = pie(pieData);

        const paths = pieGroup.selectAll("path.slice").data(arcs, d => d.data.province);
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
                    .html(`<strong>${d.data.province}</strong><br>${d.data.value.toLocaleString()} immigrants<br>${percent}% of total`)
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

        const lines = polylineGroup.selectAll("polyline").data(arcs, d => d.data.province);
        lines.enter()
            .append("polyline")
            .attr("stroke", "black")
            .attr("stroke-width", 1)
            .attr("fill", "none")
            .merge(lines)
            .transition()
            .duration(600)
            .attr("points", d => {
                const posA = arc.centroid(d);
                const posB = outerArc.centroid(d);
                const posC = [...posB];
                posC[0] = (d.endAngle + d.startAngle) / 2 < Math.PI ? radius * 1.3 : -radius * 1.3;
                return [posA, posB, posC];
            });
        lines.exit().remove();

        const labels = labelGroup.selectAll("text").data(arcs, d => d.data.province);
        labels.enter()
            .append("text")
            .attr("font-size", "11px")
            .attr("alignment-baseline", "middle")
            .attr("fill", "#333")
            .merge(labels)
            .transition()
            .duration(600)
            .attr("transform", d => {
                const pos = outerArc.centroid(d);
                pos[0] = (d.endAngle + d.startAngle) / 2 < Math.PI ? radius * 1.35 : -radius * 1.35;
                return `translate(${pos + 50})`;
            })
            .style("text-anchor", d => ((d.endAngle + d.startAngle) / 2 < Math.PI ? "start" : "end"))
            .text(d => d.data.province);
        labels.exit().remove();

        const pieLegendX = pieX - radius;
        svg.append("text")
            .attr("class", "pie-chart-title")
            .attr("x", pieLegendX)
            .attr("y", -50)
            .attr("font-size", "14px")
            .attr("font-weight", "bold")
            .text(`Immigration by province: year ${selectedYear}`);

        svg.append("text")
            .attr("class", "tooltip-legend")
            .attr("x", pieLegendX)
            .attr("y", -30)
            .attr("font-size", "11px")
            .attr("fill", "#666")
            .text("Hover slices or bars to see values");
    }

    updatePieChart(selectedYear);
}
