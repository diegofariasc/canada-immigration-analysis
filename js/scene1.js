function renderScene1(container, annotation, allData) {
    const data = allData.immigrationData;

    container.insert("h2", ":first-child").text("Growing Immigration in Canada");

    const margin = { top: 60, right: 40, bottom: 60, left: 80 },
        width = 800 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    const svg = container.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Scales
    const x = d3.scaleBand()
        .domain(data.map(d => d.year))
        .range([0, width])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d["new immigrants"]) * 1.1])
        .range([height, 0]);

    // Axes
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickValues(x.domain().filter((d, i) => i % 5 === 0)))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    svg.append("g")
        .call(d3.axisLeft(y));

    // Bars with animation
    svg.selectAll(".bar")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.year))
        .attr("y", height)
        .attr("width", x.bandwidth())
        .attr("height", 0)
        .attr("fill", "#1976d2")
        .transition()
        .duration(800)
        .delay((d, i) => i * 30)
        .attr("y", d => y(d["new immigrants"]))
        .attr("height", d => height - y(d["new immigrants"]));

    // Highlight max bar
    const maxPoint = data.reduce((a, b) => (a["new immigrants"] > b["new immigrants"] ? a : b));

    svg.append("rect")
        .attr("x", x(maxPoint.year))
        .attr("y", y(maxPoint["new immigrants"]))
        .attr("width", x.bandwidth())
        .attr("height", height - y(maxPoint["new immigrants"]))
        .attr("fill", "#d32f2f")
        .attr("opacity", 0)
        .transition()
        .delay(data.length * 30 + 300)
        .duration(500)
        .attr("opacity", 1);

    svg.append("text")
        .attr("x", x(maxPoint.year) + x.bandwidth() / 2)
        .attr("y", y(maxPoint["new immigrants"]) - 10)
        .attr("text-anchor", "middle")
        .attr("fill", "#d32f2f")
        .attr("font-size", "12px")
        .text(`Peak: ${maxPoint["new immigrants"].toLocaleString()} in ${maxPoint.year}`)
        .style("opacity", 0)
        .transition()
        .delay(data.length * 30 + 400)
        .duration(500)
        .style("opacity", 1);

    // Trendline (linear regression)
    const xVals = data.map(d => d.year);
    const yVals = data.map(d => d["new immigrants"]);
    const n = data.length;
    const sumX = d3.sum(xVals);
    const sumY = d3.sum(yVals);
    const sumXY = d3.sum(data, d => d.year * d["new immigrants"]);
    const sumX2 = d3.sum(xVals, d => d * d);
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const trendData = [
        { year: xVals[0], immigrants: slope * xVals[0] + intercept },
        { year: xVals[n - 1], immigrants: slope * xVals[n - 1] + intercept }
    ];

    const line = d3.line()
        .x(d => x(d.year) + x.bandwidth() / 2)
        .y(d => y(d.immigrants));

    const trendPath = svg.append("path")
        .datum(trendData)
        .attr("fill", "none")
        .attr("stroke", "#ff9800")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "5,5")
        .attr("d", line);

    const totalLength = trendPath.node().getTotalLength();

    trendPath
        .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .delay(data.length * 30 + 200)
        .duration(1500)
        .ease(d3.easeCubicInOut)
        .attr("stroke-dashoffset", 0);

    // Axis labels
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 50)
        .attr("text-anchor", "middle")
        .attr("font-size", "14px")
        .text("Year");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -60)
        .attr("x", -height / 2)
        .attr("text-anchor", "middle")
        .attr("font-size", "14px")
        .text("New Immigrants");

    // Annotation
    annotation.text("Canada receives more immigrants every year. The trendline shows a steady growth.");
}
