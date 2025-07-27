let scene3_hasRendered = false;
let scene3_data;
let scene3_margin;
let scene3_globalContainer;

function scene3_render(container, _, allData) {
    scene3_data = allData.unemploymentData;
    scene3_globalContainer = container;
    scene3_margin = { top: 60, right: 200, bottom: 60, left: 80 };

    insertTitleAndDescription(
        container,
        "Canada's Newcomer Job Puzzle",
        "Despite Canada's high immigration, <strong>securing employment</strong> remains difficult for newcomers. While <strong>Ontario</strong> attracts the most immigrants, it faces the <strong>highest unemployment rate</strong>. This is further complicated by <strong>foreign credential recognition difficulties</strong>. In 2023, the Ontario Office of the Fairness Commissioner report found that over 60% of internationally trained professionals face delays or barriers when seeking license recognition, severely impeding their economic integration"
    );

    insertFooter(container, {
        textHtml: "Ontario attracts many newcomers through its accessible <strong>Provincial Nominee Program (PNP)</strong>, which facilitates <strong>permanent residency (PR)</strong> but requires to live and work in the province for up to <strong>3 years</strong>, regardless of job prospects. Over <strong>30%</strong> of immigrants arrived via PNP in 2023. <strong>Hover</strong> to see details for every province.",
        sources: ["Statistics Canada, <i>Employment and unemployment rate, monthly, unadjusted for seasonality</i>", "Statistics Canada, <i>Estimates of demographic growth components (annual)</i>"]
    });

    scene3_draw(container);
    scene3_hasRendered = true;
    window.addEventListener("resize", scene3_draw);
}


function scene3_draw() {
    scene3_globalContainer.selectAll("svg").remove();
    scene3_globalContainer.selectAll(".tooltip").remove();

    const containerNode = scene3_globalContainer.node();
    const containerWidth = containerNode.clientWidth;
    const containerHeight = containerNode.clientHeight;
    const isHighEnough = containerHeight >= 260;

    const width = containerWidth - scene3_margin.left - scene3_margin.right + (isHighEnough ? 0 : 140);
    const height = containerHeight - scene3_margin.top - scene3_margin.bottom;

    const svg = scene3_globalContainer.append("svg")
        .attr("width", containerWidth)
        .attr("height", containerHeight)
        .append("g")
        .attr("transform", `translate(${scene3_margin.left},${scene3_margin.top})`);

    const x = d3.scaleLog()
        .domain([Math.max(1, d3.min(scene3_data, d => d["Number of immigrants"])), d3.max(scene3_data, d => d["Number of immigrants"])])
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(scene3_data, d => d["Unemployment rate"]) * 1.1])
        .range([height, 0]);

    scene3_drawAxes(svg, x, y, width, height);

    const scene3_color = d3.scaleOrdinal().domain(scene3_data.map(d => d.Province)).range(d3.schemeTableau10);
    const scene3_tooltip = scene3_createTooltip(scene3_globalContainer);

    scene3_drawAverageLine(svg, scene3_data, y, width);

    const ontario = scene3_data.find(d => d.Province === "Ontario");
    if (ontario) {
        scene3_drawOntarioAnnotation(svg, ontario, x, y);
    }

    const scene3_points = scene3_drawPoints(svg, scene3_data, x, y, scene3_color, height, scene3_tooltip);

    if (!scene3_hasRendered) {
        scene3_points.transition()
            .delay((d, i) => i * 100)
            .duration(800)
            .attr("cy", d => y(d["Unemployment rate"]))
            .attr("opacity", 1);
    } else {
        scene3_points
            .attr("cy", d => y(d["Unemployment rate"]))
            .attr("opacity", 1);
    }

    if (isHighEnough) {
        scene3_drawLegend(svg, scene3_data, scene3_color, width, containerHeight);
    }
}

function scene3_drawAxes(svg, x, y, width, height) {
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
}

function scene3_createTooltip(container) {
    return container.append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background", "rgba(0,0,0,0.7)")
        .style("border", "none")
        .style("padding", "6px 10px")
        .style("border-radius", "4px")
        .style("font-size", "11px")
        .style("pointer-events", "none")
        .style("color", "white");
}

function scene3_drawPoints(svg, data, x, _, color, height, tooltip) {
    return svg.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", d => x(d["Number of immigrants"]))
        .attr("cy", height)
        .attr("r", 6)
        .attr("fill", d => color(d.Province))
        .attr("opacity", 0)
        .attr("cursor", "pointer")
        .on("mouseover", (event, d) => {
            d3.select(event.currentTarget)
                .attr("stroke", "black")
                .attr("stroke-width", 2)
                .attr("r", 7)
                .raise();

            tooltip.transition().duration(200).style("opacity", 1);
            tooltip.html(`
                <strong class="tooltip-strong">${d.Province}</strong><br/>
                Immigrants: ${d["Number of immigrants"].toLocaleString()}<br/>
                Unemployment: ${d["Unemployment rate"]}%`)
                .style("left", (event.pageX - 80) + "px")
                .style("top", (event.pageY - 20) + "px");
        })
        .on("mouseout", (event) => {
            d3.select(event.currentTarget)
                .attr("stroke", "none")
                .attr("r", 6);

            tooltip.transition().duration(200).style("opacity", 0);
        });
}

function scene3_drawLegend(svg, data, color, width, height) {
    const uniqueProvinces = [...new Set(data.map(d => d.Province))];

    const legend = svg.append("g")
        .attr("transform", `translate(${width + 20}, ${-60 + (height - 260) / 2})`);

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

function scene3_drawAverageLine(svg, data, y, width) {
    const mean = d3.mean(data, d => d["Unemployment rate"]);
    svg.append("line")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", y(mean))
        .attr("y2", y(mean))
        .attr("stroke", "#999")
        .attr("stroke-dasharray", "4 4")
        .attr("stroke-width", 2);

    svg.append("text")
        .attr("x", width - 10)
        .attr("y", y(mean) - 6)
        .attr("text-anchor", "end")
        .attr("fill", "#666")
        .attr("font-size", "12px")
        .text(`Average: ${mean.toFixed(1)}%`);
}

function scene3_drawOntarioAnnotation(svg, ontario, x, y) {
    const ox = x(ontario["Number of immigrants"]);
    const oy = y(ontario["Unemployment rate"]);

    const line = svg.append("line")
        .attr("x1", ox)
        .attr("y1", oy)
        .attr("x2", ox - 80)
        .attr("y2", oy - 50)
        .attr("stroke", "gray")
        .attr("stroke-width", 1.5)
        .attr("stroke-dasharray", "4 2")
        .style("opacity", scene3_hasRendered ? 1 : 0);

    if (!scene3_hasRendered) {
        line.transition().delay(1600).duration(600).style("opacity", 1);
    }

    const text = svg.append("text")
        .attr("x", ox - 85)
        .attr("y", oy - 60)
        .attr("fill", "gray")
        .attr("font-size", "12px")
        .attr("text-anchor", "end")
        .style("opacity", scene3_hasRendered ? 1 : 0);

    if (!scene3_hasRendered) {
        text.transition().delay(1600).duration(600).style("opacity", 1);
    }

    text.text("Ontario has the most immigrants but also one of the")
        .append("tspan").attr("x", ox - 85).attr("dy", "1.2em").text("highest unemployment rates. In 2023, around 34,819")
        .append("tspan").attr("x", ox - 85).attr("dy", "1.2em").text("newly-admitted immigrants ended up unemployed");
}
