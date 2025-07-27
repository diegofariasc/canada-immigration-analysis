let scene3_hasRendered = false;

function scene3_render(container, annotation, allData) {
    const data = allData.unemploymentData;
    const margin = { top: 60, right: 200, bottom: 60, left: 80 };
    let svg, tooltip;

    insertTitleAndDescription(
        container,
        "Qualified, Yet Challenged: Canada's Job Market",
        "Despite Canada's high immigration, <strong>securing employment</strong> remains difficult for newcomers. While <strong>Ontario</strong> attracts the most immigrants, it faces the <strong>highest unemployment rate</strong>. This is further complicated by <strong>foreign credential recognition difficulties</strong>. In 2023, the Ontario Office of the Fairness Commissioner report found that over 60% of internationally trained professionals face delays or barriers when seeking license recognition, severely impeding their economic integration"
    );

    insertFooter(container, {
        textHtml: "Provinces preselected based on recent high migration inflows: British Columbia, Quebec, and Ontario. <strong>Toggle</strong> to compare housing price trends across different provinces. <strong>Hover</strong> to see details for each year",
        sources: ["Statistics Canada, <i>Estimates of demographic growth components (annual)</i>"]
    });


    function renderChart() {
        container.selectAll("svg").remove();
        container.selectAll(".tooltip").remove();

        const containerNode = container.node();
        const containerWidth = containerNode.clientWidth;
        const containerHeight = containerNode.clientHeight;
        const isHighEnough = containerHeight >= 260;

        const width = containerWidth - margin.left - margin.right + (isHighEnough ? 0 : 140);
        const height = containerHeight - margin.top - margin.bottom;

        svg = container.append("svg")
            .attr("width", containerWidth)
            .attr("height", containerHeight)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3.scaleLog()
            .domain([Math.max(1, d3.min(data, d => d["Number of immigrants"])), d3.max(data, d => d["Number of immigrants"])])
            .range([0, width]);

        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => d["Unemployment rate"]) * 1.1])
            .range([height, 0]);

        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x).ticks(6, "~s"))
            .append("text")
            .attr("x", width / 2)
            .attr("y", 45)
            .attr("text-anchor", "middle")
            .attr("fill", "#333")
            .attr("font-size", "12px")
            .attr("font-family", "system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif")
            .attr("font-weight", 500)
            .text("Number of Immigrants");

        svg.append("g")
            .call(d3.axisLeft(y).ticks(6).tickFormat(d => d + "%"))
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", -50)
            .attr("text-anchor", "middle")
            .attr("fill", "#333")
            .attr("font-size", "12px")
            .attr("font-family", "system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif")
            .attr("font-weight", 500)
            .text("Unemployment Rate");

        const color = d3.scaleOrdinal()
            .domain(data.map(d => d.Province))
            .range(d3.schemeTableau10);

        tooltip = container.append("div")
            .attr("class", "tooltip")
            .style("opacity", 0)
            .style("position", "absolute")
            .style("background", "#fff")
            .style("border", "1px solid #ccc")
            .style("padding", "8px")
            .style("border-radius", "4px")
            .style("pointer-events", "none");

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

        if (!scene3_hasRendered) {
            points.transition()
                .delay((d, i) => i * 100)
                .duration(800)
                .attr("cy", d => y(d["Unemployment rate"]))
                .attr("opacity", 1);

        } else {
            points
                .attr("cy", d => y(d["Unemployment rate"]))
                .attr("opacity", 1);
        }

        if (isHighEnough) {
            const uniqueProvinces = [...new Set(data.map(d => d.Province))];

            const legend = svg.append("g")
                .attr("transform", `translate(${width + 20}, ${-60 + (containerHeight - 260) / 2})`);

            uniqueProvinces.forEach((province, i) => {
                const g = legend.append("g")
                    .attr("transform", `translate(0, ${i * 20})`);

                g.append("rect")
                    .attr("width", 12)
                    .attr("height", 12)
                    .attr("fill", color(province));

                g.append("text")
                    .attr("x", 18)
                    .attr("y", 10)
                    .attr("font-size", "11px")
                    .text(province);
            });
        }
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
            .text(`Average: ${meanUnemployment.toFixed(1)}%`);

        const ontario = data.find(d => d.Province === "Ontario");

        if (ontario) {
            const ox = x(ontario["Number of immigrants"]);
            const oy = y(ontario["Unemployment rate"]);

            if (!scene3_hasRendered) {
                svg.append("line")
                    .attr("x1", ox)
                    .attr("y1", oy)
                    .attr("x2", ox - 80)
                    .attr("y2", oy - 60)
                    .attr("stroke", "gray")
                    .attr("stroke-width", 1.5)
                    .attr("stroke-dasharray", "4 2")
                    .style("opacity", 0)
                    .transition()
                    .delay(1600)
                    .duration(600)
                    .style("opacity", 1);
            } else {
                svg.append("line")
                    .attr("x1", ox)
                    .attr("y1", oy)
                    .attr("x2", ox - 80)
                    .attr("y2", oy - 60)
                    .attr("stroke", "gray")
                    .attr("stroke-width", 1.5)
                    .attr("stroke-dasharray", "4 2")
                    .style("opacity", 1);
            }


            const annotationText = svg.append("text")
                .attr("x", ox - 85)
                .attr("y", oy - 60)
                .attr("fill", "gray")
                .attr("font-size", "12px")
                .attr("text-anchor", "end")
                .style("opacity", 0);

            if (!scene3_hasRendered) {
                annotationText.transition()
                    .delay(1600)
                    .duration(600)
                    .style("opacity", 1);

            } else {
                annotationText
                    .style("opacity", 1);
            }


            annotationText.text("Ontario has the most immigrants but also one of the");

            annotationText.append("tspan")
                .attr("x", ox - 85)
                .attr("dy", "1.2em")
                .text("highest unemployment rates. In 2023, around 34,819");

            annotationText.append("tspan")
                .attr("x", ox - 85)
                .attr("dy", "1.2em")
                .text("newly-admitted immigrants ended up unemployed");
        }
    }

    renderChart();
    scene3_hasRendered = true;

    window.addEventListener("resize", renderChart);
}
