function renderScene3(container, annotation, allData) {
    const data = allData.unemploymentData;

    container.insert("h2", ":first-child").text("Unemployment and Immigration by Province");

    const margin = { top: 60, right: 130, bottom: 60, left: 80 },
        width = 800 - margin.left - margin.right,
        height = 450 - margin.top - margin.bottom;

    const svg = container.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Scales
    const x = d3.scaleLog()
        .domain([Math.max(1, d3.min(data, d => d["Number of immigrants"])), d3.max(data, d => d["Number of immigrants"])])
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d["Unemployment rate"]) * 1.1])
        .range([height, 0]);

    // Axes
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(6, "~s"))
        .append("text")
        .attr("x", width / 2)
        .attr("y", 45)
        .attr("text-anchor", "middle")
        .attr("fill", "#333")
        .attr("font-size", "14px")
        .text("Number of Immigrants (log scale)");

    svg.append("g")
        .call(d3.axisLeft(y).ticks(6).tickFormat(d => d + "%"))
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -50)
        .attr("text-anchor", "middle")
        .attr("fill", "#333")
        .attr("font-size", "14px")
        .text("Unemployment Rate");

    // Color scale
    const color = d3.scaleOrdinal()
        .domain(data.map(d => d.Province))
        .range(d3.schemeTableau10);

    // Tooltip div
    const tooltip = container.append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background", "#fff")
        .style("border", "1px solid #ccc")
        .style("padding", "8px")
        .style("border-radius", "4px")
        .style("pointer-events", "none");

    // Points with animation
    const points = svg.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", d => x(d["Number of immigrants"]))
        .attr("cy", height)
        .attr("r", 6)
        .attr("fill", d => color(d.Province))
        .attr("opacity", 0)
        .on("mouseover", (event, d) => {
            tooltip.transition().duration(200).style("opacity", 1);
            tooltip.html(`
                <strong>${d.Province}</strong><br/>
                Immigrants: ${d["Number of immigrants"].toLocaleString()}<br/>
                Unemployment: ${d["Unemployment rate"]}%`)
                .style("left", (event.pageX + 15) + "px")
                .style("top", (event.pageY - 30) + "px");
        })
        .on("mouseout", () => {
            tooltip.transition().duration(200).style("opacity", 0);
        });

    points.transition()
        .delay((d, i) => i * 100)
        .duration(800)
        .attr("cy", d => y(d["Unemployment rate"]))
        .attr("opacity", 1);

    // Legend
    const uniqueProvinces = [...new Set(data.map(d => d.Province))];

    const legend = svg.append("g")
        .attr("transform", `translate(${width + 20}, 0)`);

    uniqueProvinces.forEach((prov, i) => {
        const g = legend.append("g")
            .attr("transform", `translate(0, ${i * 20})`);

        g.append("rect")
            .attr("width", 12)
            .attr("height", 12)
            .attr("fill", color(prov));

        g.append("text")
            .attr("x", 18)
            .attr("y", 10)
            .attr("font-size", "11px")
            .text(prov);
    });

    // Mean unemployment line
    const meanUnemployment = d3.mean(data, d => d["Unemployment rate"]);

    svg.append("line")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", y(meanUnemployment))
        .attr("y2", y(meanUnemployment))
        .attr("stroke", "#999")
        .attr("stroke-dasharray", "4 4")
        .attr("stroke-width", 1.5);

    svg.append("text")
        .attr("x", width - 10)
        .attr("y", y(meanUnemployment) - 6)
        .attr("text-anchor", "end")
        .attr("fill", "#666")
        .attr("font-size", "12px")
        .text(`National average: ${meanUnemployment.toFixed(1)}%`);

    // Ontario annotation with leader line
    const ontario = data.find(d => d.Province === "Ontario");

    if (ontario) {
        const ox = x(ontario["Number of immigrants"]);
        const oy = y(ontario["Unemployment rate"]);

        svg.append("line")
            .attr("x1", ox)
            .attr("y1", oy)
            .attr("x2", ox - 80)
            .attr("y2", oy - 60)
            .attr("stroke", "gray")
            .attr("stroke-width", 1.5)
            .attr("stroke-dasharray", "4 2");

        // Annotation text
        const annotationText = svg.append("text")
            .attr("x", ox - 85)
            .attr("y", oy - 95)
            .attr("fill", "gray")
            .attr("font-size", "12px")
            .attr("text-anchor", "end")
            .text("Ontario has the most immigrants,");

        annotationText.append("tspan")
            .attr("x", ox - 85)
            .attr("dy", "1.2em")
            .attr("text-anchor", "end")
            .text("but also one of the highest unemployment");

        annotationText.append("tspan")
            .attr("x", ox - 85)
            .attr("dy", "1.2em")
            .attr("text-anchor", "end")
            .text("rates. In 2023, around 34,819 newly-admitted");


        annotationText.append("tspan")
            .attr("x", ox - 85)
            .attr("dy", "1.2em")
            .attr("text-anchor", "end")
            .text(" immigrants ended up unemployed");
    }

    // General annotation
    annotation.text("Provinces like Quebec dominate in immigrant numbers, while others like Newfoundland show high unemployment despite fewer immigrants. A log scale reveals regional disparities. Ontario stands out as a high-immigration, high-unemployment province.");
}
