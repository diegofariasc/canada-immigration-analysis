let scene4_container;
let scene4_annotation;
let scene4_data;
let scene4_hasRendered = false;

function scene4_updateChart() {
    scene4_renderScene(scene4_container, scene4_annotation, scene4_data);
    scene4_hasRendered = true;
}

function scene4_render(container, annotation, allData) {
    scene4_container = container;
    scene4_annotation = annotation;
    scene4_data = allData;

    requestIdleCallback(scene4_updateChart, { timeout: 1000 });
    window.addEventListener("resize", scene4_debouncedRedraw);
}

const scene4_debouncedRedraw = debounce(scene4_updateChart, DEBOUNCE_TIMEOUT);

function scene4_renderScene(container, annotation, allData) {
    const data = allData.healthData;
    const geoData = allData.provinces;

    insertTitleAndDescription(
        container,
        "Newcomers in Search of Care",
        "Upon landing, newcomers will often face healthcare access issues. In 2023, almost <strong>23% of immigrants</strong> with under 10 years in Canada lacked a regular health provider. Notably, in top destinations like <strong>Ontario (8.5%)</strong> and <strong>British Columbia (10.0%)</strong>, immigrants typically encounter significant unmet needs. The choropleth map highlights provincial differences, revealing where newcomers face the greatest access gaps"
    );

    insertFooter(container, {
        textHtml: "<strong>Hover</strong> to see details for every province.",
        sources: ["Statistics Canada, <i>Unmet health care needs by sex and age group</i>"]
    });

    container.selectAll("*").remove();

    const containerNode = container.node();
    const containerWidth = containerNode.clientWidth;
    const containerHeight = containerNode.clientHeight;

    const svg = container.append("svg")
        .attr("width", containerWidth)
        .attr("height", containerHeight)
        .style("overflow", "visible");

    const projection = d3.geoMercator()
        .fitSize([containerWidth, containerHeight], geoData);

    const path = d3.geoPath().projection(projection);

    const tooltip = container.append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("pointer-events", "none")
        .style("background", "rgba(0,0,0,0.7)")
        .style("padding", "6px 10px")
        .style("border-radius", "4px")
        .style("font-size", "11px")
        .style("color", "white")
        .style("visibility", "hidden");

    const maxVal = d3.max(data, d => d["unmet needs percentage"]);
    const color = d3.scaleLinear()
        .domain([0, maxVal * 0.5, maxVal])
        .range([
            "#3a7d44",
            "#f2c14e",
            "#d94f4f"
        ]);

    const valueMap = {};
    data.forEach(d => {
        valueMap[d.province.toLowerCase()] = d["unmet needs percentage"];
    });

    if (!scene4_hasRendered) {
        svg.selectAll("path")
            .data(geoData.features)
            .enter()
            .append("path")
            .attr("class", "animated-map-path")
            .attr("d", path)
            .attr("stroke", "#fff")
            .attr("stroke-width", 1)
            .attr("fill", "#ccc")
            .on("mouseover", function (_, d) {
                const name = d.properties.name?.toLowerCase();
                const val = valueMap[name];
                if (val != null) {
                    tooltip
                        .style("visibility", "visible")
                        .html(`<strong class="tooltip-strong">${d.properties.name}</strong><br/>${val.toFixed(1)}% unmet needs`);
                    d3.select(this).raise()
                        .classed("hovered", true)
                        .attr("stroke", "#000")
                        .attr("stroke-width", 2)
                        .style("cursor", "pointer");
                }
            })
            .on("mousemove", function (event) {
                tooltip
                    .style("top", (event.pageY - 28) + "px")
                    .style("left", (event.pageX + 10) + "px");
            })
            .on("mouseout", function () {
                tooltip.style("visibility", "hidden");
                d3.select(this)
                    .attr("stroke", "#fff")
                    .attr("stroke-width", 1)
                    .style("cursor", "default");
            })
            .transition()
            .duration(500)
            .attr("fill", d => {
                const name = d.properties.name?.toLowerCase();
                const val = valueMap[name];
                return val != null ? color(val) : "#ccc";
            });
    } else {
        svg.selectAll("path")
            .data(geoData.features)
            .enter()
            .append("path")
            .attr("d", path)
            .attr("stroke", "#fff")
            .attr("stroke-width", 1)
            .attr("fill", "#ccc")
            .on("mouseover", function (event, d) {
                const name = d.properties.name?.toLowerCase();
                const val = valueMap[name];
                if (val != null) {
                    tooltip
                        .style("visibility", "visible")
                        .html(`<strong>${d.properties.name}</strong><br/>${val.toFixed(1)}% unmet needs`);
                    d3.select(this).raise()
                        .classed("hovered", true)
                        .attr("stroke", "#000")
                        .attr("stroke-width", 2)
                        .style("cursor", "pointer");
                }
            })
            .on("mousemove", function (event) {
                tooltip
                    .style("top", (event.pageY - 28) + "px")
                    .style("left", (event.pageX + 10) + "px");
            })
            .on("mouseout", function () {
                tooltip.style("visibility", "hidden");
                d3.select(this)
                    .attr("stroke", "#fff")
                    .attr("stroke-width", 1)
                    .style("cursor", "default");
            })
            .attr("fill", d => {
                const name = d.properties.name?.toLowerCase();
                const val = valueMap[name];
                return val != null ? color(val) : "#ccc";
            });
    }

    const legendWidth = 150;
    const legendHeight = 15;
    const legendMargin = 20;

    const legendSvg = svg.append("g")
        .attr("transform", `translate(${containerWidth - legendWidth - legendMargin}, ${legendMargin})`);

    const defs = svg.append("defs");

    const linearGradient = defs.append("linearGradient")
        .attr("id", "legend-gradient")
        .attr("x1", "0%").attr("y1", "0%")
        .attr("x2", "100%").attr("y2", "0%");

    linearGradient.selectAll("stop")
        .data([0, 0.5, 1])
        .enter()
        .append("stop")
        .attr("offset", d => `${d * 100}%`)
        .attr("stop-color", d => color(d * maxVal));

    legendSvg.append("rect")
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#legend-gradient)")
        .style("stroke", "#ccc")
        .style("stroke-width", 1);

    const legendScale = d3.scaleLinear()
        .domain([0, maxVal])
        .range([0, legendWidth]);

    const legendAxis = d3.axisBottom(legendScale)
        .ticks(5)
        .tickFormat(d => d + "%");

    legendSvg.append("g")
        .attr("transform", `translate(0, ${legendHeight})`)
        .call(legendAxis)
        .attr("font-size", "10px");

    legendSvg.append("text")
        .attr("x", legendWidth / 2)
        .attr("y", -6)
        .attr("text-anchor", "middle")
        .attr("font-size", "11px")
        .attr("font-family", "system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif")
        .attr("font-weight", 500)
        .text("Unmet Health Needs (%)");

    scene4_drawAnnotations(svg, projection);
}

function scene4_getCentroid(provinceName, projection) {
    const province = scene4_data.provinces.features.find(
        f => f.properties.name.toLowerCase() === provinceName.toLowerCase()
    );
    return province ? d3.geoPath(projection).centroid(province) : [0, 0];
};


function scene4_drawAnnotations(svg, projection) {
    const containerNode = container.node();
    const containerWidth = containerNode.clientWidth;

    const annotations = [
        {
            title: "British Columbia long waits",
            label: "~10.0% of newcomers lack a family doctor and waitlists are over 6 months for primary care in major cities",
            province: "British Columbia",
            dx: Math.max(Math.min(-containerWidth + 700, -60), -150),
            dy: 0
        },
        {
            title: "Quebec policy-driven access barriers",
            label: "~7.5% of newcomers lack medical care. Many must wait 3+ months for RAMQ eligibility, delaying even basic care after arrival.",
            province: "Quebec",
            dx: Math.min(Math.max(containerWidth - 700, 60), 150),
            dy: -30
        }
    ].map(a => {
        const [x, y] = scene4_getCentroid(a.province, projection);
        return {
            note: {
                title: a.title,
                label: a.label,
                wrap: 120
            },
            x,
            y,
            dx: a.dx,
            dy: a.dy,
            subject: { radius: 6, radiusPadding: 3 }
        };
    });

    svg.append("g")
        .attr("class", "annotation-group")
        .attr("fill", "#555")
        .style("font-size", "11px")
        .call(
            d3.annotation()
                .type(d3.annotationCallout)
                .annotations(annotations)
        );
}