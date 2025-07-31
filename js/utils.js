function insertTitleAndDescription(container, title, textHtml) {
    const parent = d3.select(container.node().parentNode);
    parent.selectAll(".info-wrapper").remove();

    const wrapper = parent.insert("div", () => container.node())
        .attr("class", "info-wrapper");

    wrapper.append("h1")
        .attr("class", "info-title")
        .text(title);

    wrapper.append("p")
        .attr("class", "info-text")
        .html(textHtml);
}

function insertFooter(container, { textHtml = null, sources = [] } = {}) {
    const parent = d3.select(container.node().parentNode);
    parent.selectAll(".info-footer-wrapper").remove();

    const controls = parent.select("#controls");

    const wrapper = parent.insert("div", () => controls.node())
        .attr("class", "info-footer-wrapper");

    if (textHtml) {
        wrapper.append("p")
            .attr("class", "info-footer-text")
            .html(textHtml);
    }

    if (sources.length > 0) {
        const list = wrapper.append("ul")
            .attr("class", "info-footer-sources");

        sources.forEach(source => {
            list.append("li")
                .attr("class", "info-footer-source")
                .html(source);
        });
    }
}

function waitMs(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function filterPolygonsByLat(feature) {
    if (feature.geometry.type === "MultiPolygon") {
        const filteredPolygons = feature.geometry.coordinates.filter(polygon => {
            const maxLat = d3.max(polygon.flat(), d => d[1]);
            return maxLat <= LATITUDE_LIMIT;
        });
        return {
            ...feature,
            geometry: {
                ...feature.geometry,
                coordinates: filteredPolygons
            }
        };
    } else if (feature.geometry.type === "Polygon") {
        const maxLat = d3.max(feature.geometry.coordinates.flat(), d => d[1]);
        if (maxLat > LATITUDE_LIMIT) {
            return null;
        }
        return feature;
    }
    return feature;
}

function getPriceAtYear(year, province = null) {
    const values = savedAllData.housingData.filter(d => d.Year === year && (!province || d.Province === province));
    if (!values.length) return null;
    return d3.mean(values, d => +d.AveragePrice_CAD);
}

function debounce(func, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}