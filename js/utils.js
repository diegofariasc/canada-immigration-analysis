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
