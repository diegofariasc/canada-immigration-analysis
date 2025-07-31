let scene3_hasRendered = false;
let scene3_data;
let scene3_margin;
let scene3_globalContainer;

function scene3_render(container, _, allData) {
    scene3_data = allData.unemploymentData;
    scene3_globalContainer = container;
    scene3_margin = { top: 60, right: 80, bottom: 60, left: 80 };

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
    window.addEventListener("resize", scene3_debouncedRedraw);
}

const scene3_debouncedRedraw = debounce(scene3_draw, DEBOUNCE_TIMEOUT);

function scene3_draw() {
    scene3_globalContainer.selectAll("svg").remove();
    scene3_globalContainer.selectAll(".tooltip").remove();

    const containerNode = scene3_globalContainer.node();
    const containerWidth = containerNode.clientWidth;
    const containerHeight = containerNode.clientHeight;
    const isHighEnough = containerHeight >= 260;

    const width = containerWidth - scene3_margin.left - scene3_margin.right + (isHighEnough ? 0 : 20);
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

    const scene3_tooltip = scene3_createTooltip(scene3_globalContainer);

    scene3_drawAverageLine(svg, scene3_data, y, width);
    scene3_drawAnnotations(svg, x, y);

    const scene3_points = scene3_drawPoints(svg, x, height, scene3_tooltip);

    if (!scene3_hasRendered) {
        scene3_points.transition()
            .delay((_, i) => i * 100)
            .duration(800)
            .attr("cy", d => y(d["Unemployment rate"]))
            .attr("opacity", 1);
    } else {
        scene3_points
            .attr("cy", d => y(d["Unemployment rate"]))
            .attr("opacity", 1);
    }

    if (isHighEnough) {
        scene3_drawLegend(svg, width, containerHeight);
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

function scene3_drawPoints(svg, x, height, tooltip) {
    return svg.selectAll("circle")
        .data(scene3_data)
        .enter()
        .append("circle")
        .attr("cx", d => x(d["Number of immigrants"]))
        .attr("cy", height)
        .attr("r", 6)
        .attr("fill", d => provincesColorPalette[d.Province])
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

function scene3_drawLegend(svg, width, height) {

    const legend = svg.append("g")
        .attr("transform", `translate(${width + 20}, ${-60 + (height - 260) / 2})`);

    Object.keys(provinceAbbreviation).forEach((province, i) => {
        const g = legend.append("g")
            .attr("transform", `translate(0, ${i * 20})`);

        g.append("rect")
            .attr("width", 12)
            .attr("height", 12)
            .attr("fill", provincesColorPalette[province]);

        g.append("text")
            .attr("x", 18)
            .attr("y", 10)
            .attr("font-size", "11px")
            .text(provinceAbbreviation[province]);
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

function scene3_drawAnnotations(svg, x, y) {
    const ontario = scene3_data.find(d => d.Province === "Ontario");
    const quebec = scene3_data.find(d => d.Province === "Quebec");

    const annotations = [
        {
            note: {
                title: "Ontario's Newcomer Job Challenge",
                label: "Ontario has the most immigrants but one of the highest unemployment rates. In 2023, about 34,819 new immigrants ended up unemployed",
                wrap: 240,
                align: "right"
            },
            x: x(ontario["Number of immigrants"]),
            y: y(ontario["Unemployment rate"]),
            dx: -10,
            dy: -20,
            subject: {
                radius: 6,
                radiusPadding: 3
            }
        },
        {
            note: {
                title: "Quebec reduces support services",
                label: "Quebec restricts PR access to employment services, raising newcomer unemployment ~10%",
                wrap: 240,
                align: "right"
            },
            x: x(quebec["Number of immigrants"]),
            y: y(quebec["Unemployment rate"]),
            dx: -10,
            dy: 40,
            subject: {
                radius: 6,
                radiusPadding: 3
            }
        },
    ];

    const group = svg.append("g")
        .attr("class", "annotation-group")
        .style("font-size", "11px")
        .style("font-family", "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif")
        .style("opacity", !scene3_hasRendered ? 0 : 1)
        .attr("transform", !scene3_hasRendered ? "translate(0,20)" : "translate(0,0)");

    group.call(
        d3.annotation()
            .type(d3.annotationCallout)
            .annotations(annotations)
    );

    if (!scene3_hasRendered) {
        group.transition()
            .delay(1500)
            .duration(800)
            .ease(d3.easeCubicOut)
            .style("opacity", 1)
            .attr("transform", "translate(0,0)");
    }
}