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