function insertTitleAndDescription(container, title, textHtml) {
    const parent = container.node().parentNode;

    const wrapper = d3.create("div")
        .attr("class", "info-wrapper");

    wrapper.append("h1")
        .text(title)
        .attr("class", "info-title");

    wrapper.append("p")
        .html(textHtml)
        .attr("class", "info-text");

    parent.insertBefore(wrapper.node(), container.node());
}

function insertFooter(container, { textHtml = null, sources = [] } = {}) {
    const parent = container.node().parentNode;
    parent.querySelectorAll(".info-footer-wrapper").forEach(el => el.remove());


    const wrapper = d3.create("div")
        .attr("class", "info-footer-wrapper");

    if (textHtml) {
        wrapper.append("p")
            .html(textHtml)
            .attr("class", "info-footer-text");
    }

    if (sources.length > 0) {
        const list = wrapper.append("ul")
            .attr("class", "info-footer-sources");

        sources.forEach(source => {
            list.append("li")
                .html(source)
                .attr("class", "info-footer-source");
        });
    }

    const controls = parent.querySelector("#controls");
    parent.insertBefore(wrapper.node(), controls);
}
