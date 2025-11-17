import React, { Component } from "react";
import * as d3 from "d3";

class InteractiveStreamGraph extends Component {
  componentWillUnmount() {
    d3.select("body").selectAll(".tooltip").remove();
  }

  componentDidUpdate() {
    const chartData = this.props.csvData;
    console.log("Rendering chart with data:", chartData);
    if (!chartData || chartData.length === 0) {
      d3.select(".svg_parent").selectAll("*").remove();
      return;
    }

    const llmModels = ["GPT-4", "Gemini", "PaLM-2", "Claude", "LLaMA-3.1"];

    const colors = {
      "GPT-4": "#e41a1c",
      Gemini: "#377eb8",
      "PaLM-2": "#4daf4a",
      Claude: "#984ea3",
      "LLaMA-3.1": "#ff7f00",
    };

    d3.select(".svg_parent").selectAll("*").remove();

    const margin = { top: 20, right: 150, bottom: 40, left: 50 };
    const width = 800 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const svg = d3
      .select(".svg_parent")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const processedData = chartData
      .map((d) => {
        const result = { date: d.Date };
        llmModels.forEach((model) => {
          result[model] = d[model] || 0;
        });
        return result;
      })
      .sort((a, b) => a.date - b.date);

    const stack = d3
      .stack()
      .keys(llmModels)
      .offset(d3.stackOffsetSilhouette)
      .order(d3.stackOrderNone);

    const stackedData = stack(processedData);

    const xScale = d3
      .scaleTime()
      .domain(d3.extent(processedData, (d) => d.date))
      .range([0, width]);

    const yScale = d3
      .scaleLinear()
      .domain(d3.extent(stackedData.flat(2)))
      .range([height, 0]);

    const colorScale = d3
      .scaleOrdinal()
      .domain(llmModels)
      .range(llmModels.map((model) => colors[model]));

    const area = d3
      .area()
      .x((d) => xScale(d.data.date))
      .y0((d) => yScale(d[0]))
      .y1((d) => yScale(d[1]))
      .curve(d3.curveBasis);

    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("background", "rgba(255, 255, 255, 0.95)")
      .style("color", "#333")
      .style("padding", "12px")
      .style("border-radius", "8px")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("box-shadow", "0 4px 15px rgba(0,0,0,0.2)")
      .style("border", "1px solid #ddd")
      .style("max-width", "280px");

    g.selectAll(".stream")
      .data(stackedData)
      .enter()
      .append("path")
      .attr("class", "stream")
      .attr("d", area)
      .attr("fill", (d) => colorScale(d.key))
      .attr("stroke", "none")
      .style("opacity", 0.8)
      .on("mouseover", function (event, d) {
        d3.select(this).style("opacity", 1);

        tooltip.transition().duration(200).style("opacity", 1);
        tooltip
          .html(`<strong>${d.key}</strong>`)
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 10 + "px");
      })
      .on("mousemove", function (event, d) {
        const [mouseX] = d3.pointer(event, this);
        const date = xScale.invert(mouseX);

        const bisect = d3.bisector((d) => d.data.date).left;
        const index = bisect(d, date);
        const dataPoint = d[index];

        if (dataPoint) {
          const modelData = processedData.map((entry) => ({
            date: entry.date,
            value: entry[d.key] || 0,
          }));

          const miniChartWidth = 250;
          const miniChartHeight = 150;
          const chartMargin = { top: 20, right: 20, bottom: 40, left: 40 };
          const chartWidth =
            miniChartWidth - chartMargin.left - chartMargin.right;
          const chartHeight =
            miniChartHeight - chartMargin.top - chartMargin.bottom;

          const miniYScale = d3
            .scaleLinear()
            .domain([0, d3.max(modelData, (d) => d.value)])
            .range([chartHeight, 0]);

          let miniChart = `
            <div style="margin-top: 10px;">
              <svg width="${miniChartWidth}" height="${miniChartHeight}">
                <g transform="translate(${chartMargin.left}, ${chartMargin.top})">
          `;

          const barWidth = chartWidth / modelData.length - 2;
          modelData.forEach((entry, i) => {
            const x = i * (barWidth + 2);
            const barHeight = chartHeight - miniYScale(entry.value);
            miniChart += `
              <rect x="${x}" y="${miniYScale(entry.value)}" 
                    width="${barWidth}" height="${barHeight}" 
                    fill="${
                      colors[d.key]
                    }" opacity="0.8" stroke="#fff" stroke-width="0.5">
              </rect>
            `;
          });

          const yTicks = miniYScale.ticks(5);
          yTicks.forEach((tick) => {
            const y = miniYScale(tick);
            miniChart += `
              <line x1="0" y1="${y}" x2="${chartWidth}" y2="${y}" 
                    stroke="#ddd" stroke-width="0.5"></line>
              <text x="-5" y="${
                y + 3
              }" text-anchor="end" font-size="9" fill="#666">${tick}</text>
            `;
          });

          miniChart += `
            <line x1="0" y1="${chartHeight}" x2="${chartWidth}" y2="${chartHeight}" 
                  stroke="#333" stroke-width="1"></line>
          `;

          modelData.forEach((entry, i) => {
            const x = i * (barWidth + 2) + barWidth / 2;
            const dateLabel = entry.date.toLocaleDateString("en-US", {
              month: "short",
            });
            miniChart += `
              <text x="${x}" y="${
              chartHeight + 15
            }" text-anchor="middle" font-size="8" fill="#666">${dateLabel}</text>
            `;
          });

          miniChart += `
            <line x1="0" y1="0" x2="0" y2="${chartHeight}" stroke="#333" stroke-width="1"></line>
          `;

          miniChart += `
                </g>
              </svg>
            </div>
          `;

          tooltip
            .html(miniChart)
            .style("left", event.pageX + 15 + "px")
            .style("top", event.pageY - 80 + "px");
        }
      })
      .on("mouseout", function () {
        d3.select(this).style("opacity", 0.8);

        tooltip.transition().duration(200).style("opacity", 0);
      });

    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat("%b %Y")).ticks(6))
      .selectAll("text")
      .style("text-anchor", "middle")
      .style("font-size", "12px");

    const legendOrder = [...llmModels].reverse();

    const legend = svg
      .append("g")
      .attr("class", "legend")
      .attr(
        "transform",
        `translate(${width + margin.left + 20}, ${margin.top + 50})`
      );

    legend
      .append("text")
      .attr("x", 0)
      .attr("y", -15)
      .text("LLM Models")
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .attr("fill", "#333");

    const legendItems = legend
      .selectAll(".legend-item")
      .data(legendOrder)
      .enter()
      .append("g")
      .attr("class", "legend-item")
      .attr("transform", (d, i) => `translate(0, ${i * 25})`);

    legendItems
      .append("rect")
      .attr("width", 18)
      .attr("height", 18)
      .attr("fill", (d) => colors[d])
      .attr("stroke", "#333")
      .attr("stroke-width", 0.5)
      .style("opacity", 0.8);

    legendItems
      .append("text")
      .attr("x", 25)
      .attr("y", 14)
      .text((d) => d)
      .style("font-size", "13px")
      .attr("fill", "#333")
      .attr("alignment-baseline", "middle");
  }

  render() {
    return (
      <svg style={{ width: 800, height: 500 }} className="svg_parent"></svg>
    );
  }
}

export default InteractiveStreamGraph;
