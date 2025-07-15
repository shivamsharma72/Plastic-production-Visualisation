const eiffeltowerplastic = 2000000; // metric tonnes
const million = 1000000;
const bottlespereiffel = (eiffeltowerplastic * 1000) / 0.025;
const bottlescalefactor = 20;

function calculateresponsivemargins() {
  const width = window.innerWidth;
  const basemargin = Math.min(width * 0.05, 50);
  return {
    top: basemargin,
    right: basemargin,
    bottom: basemargin,
    left: basemargin * 1.4,
  };
}

function calculateeiffeltowerdimensions() {
  const height = window.innerHeight;
  const width = window.innerWidth;
  const maxheight = height * 0.6;
  const aspectratio = 2;
  return {
    height: maxheight,
    width: maxheight / aspectratio,
    x: width / 2 - maxheight / aspectratio / 2,
    y: height - maxheight,
  };
}

function calculatebottlesize(eiffeltowers) {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const basesize = Math.min(width, height) * 0.03;
  const visualscalefactor =
    eiffeltowers > 100 ? Math.log10(eiffeltowers) / 2 : 1;
  return {
    width: basesize * visualscalefactor,
    height: basesize * 1.5 * visualscalefactor,
  };
}

function calculatebottlelayout(width, height, bottlesize) {
  const aspectratio = width / height;
  return {
    verticalspacing: Math.min(height * 0.05, bottlesize.height * 0.8),
    horizontalspacing: Math.min(width * 0.03, bottlesize.width * 0.9),
    offsetrange: {
      x: Math.min(width * 0.02, bottlesize.width * 0.3),
      y: Math.min(height * 0.02, bottlesize.height * 0.2),
    },
    pyramidfactor: Math.max(0.5, Math.min(0.8, aspectratio * 0.6)),
    maxwidth: Math.min(width * 0.8, height * 1.2),
  };
}

let currentstage = 1;
let isplaying = false;
let currentyearindex = 0;
let globaldata = [];
let currenttransition = null;
let barchartactive = false;

document.addEventListener("DOMContentLoaded", () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const margin = calculateresponsivemargins();

  const svg = d3
    .select("#vis")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const bottleChart = svg.append("g").attr("class", "bottle-chart");

  const barChartContainer = svg
    .append("g")
    .attr("class", "bar-chart-container")
    .style("opacity", 0)
    .style("display", "none");
  const barChart = barChartContainer.append("g").attr("class", "bar-chart");
  const xAxisGroup = barChartContainer
    .append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height - margin.bottom})`);
  const yAxisGroup = barChartContainer
    .append("g")
    .attr("class", "y-axis")
    .attr("transform", `translate(${margin.left},0)`);

  const xScale = d3.scaleLinear().range([margin.left, width - margin.right]);
  const yScale = d3
    .scaleLog()
    .range([height - margin.bottom, margin.top])
    .base(10);
  const xAxis = d3
    .axisBottom(xScale)
    .tickFormat(d3.format("d"))
    .ticks(10)
    .tickSize(-10)
    .tickPadding(10);
  const yAxis = d3
    .axisLeft(yScale)
    .tickFormat((d) => {
      if (d >= 1000000) {
        return `${d / 1000000}M`;
      } else if (d >= 1000) {
        return `${d / 1000}K`;
      }
      return d;
    })
    .tickValues([1000000, 100000000, 200000000, 300000000, 400000000])
    .tickSize(-width + margin.left + margin.right)
    .tickPadding(10);
  svg
    .append("text")
    .attr("class", "x-label")
    .attr("text-anchor", "middle")
    .attr("x", width / 2)
    .attr("y", height - margin.bottom - 75)
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text("Year");

  svg
    .append("text")
    .attr("class", "y-label")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", margin.left + 25)
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text("Annual Plastic Production (tonnes)");

  const eiffelTower = svg
    .append("image")
    .attr("class", "eiffel-tower")
    .attr("href", "resources/eiffele tower_bg.png")
    .attr("opacity", 0);

  function calculateEiffelTowers(tonnes) {
    return tonnes / eiffeltowerplastic;
  }
  function formatNumber(num) {
    return d3.format(",")(num);
  }
  function calculateBottleRepresentation(year, eiffelTowers) {
    return {
      bottleCount: Math.ceil(eiffelTowers),
      ratio: 1,
      description: "1 bottle = 1 Eiffel Tower",
      opacity: 1,
    };
  }

  function updateInfoPanel(data) {
    const eiffelTowers = calculateEiffelTowers(
      data.CumulativePlasticProduction
    );
    const representation = calculateBottleRepresentation(
      data.Year,
      eiffelTowers
    );
    const yearsSince1950 = data.Year - 1950;
    d3.select("#info-panel h3")
      .text("1 Eiffel Tower = 2 million tonnes")
      .style("font-size", "1.2rem")
      .style("color", "#880808");

    const statsContainer = d3.select("#info-panel .stats-container");
    statsContainer.html("");

    const representationDiv = statsContainer
      .append("div")
      .attr("class", "representation-info stat")
      .style("background", "#f0f0f0")
      .style("padding", "10px")
      .style("border-radius", "5px")
      .style(
        "border-left",
        `4px solid rgba(44, 62, 80, ${representation.opacity})`
      );
    const repContainer = representationDiv
      .append("div")
      .style("display", "flex")
      .style("align-items", "center")
      .style("gap", "10px")
      .style("margin-bottom", "5px");

    repContainer
      .append("img")
      .attr("src", "resources/plastic_bottle.png")
      .style("width", "20px")
      .style("height", "30px")
      .style("object-fit", "contain")
      .style("transition", "transform 0.3s ease");
    repContainer.append("span").text("1 = ");
    repContainer
      .append("img")
      .attr("src", "resources/eiffele tower_bg.png")
      .style("width", "20px")
      .style("height", "30px")
      .style("object-fit", "contain")
      .style("transition", "transform 0.3s ease");
    repContainer.append("span").text(` × ${representation.ratio}`);
    representationDiv
      .append("div")
      .attr("class", "label")
      .text("Current Scale");
    const stats = [
      {
        value: formatNumber(data.CumulativePlasticProduction),
        label: "Total Plastic Production (tonnes)",
      },
      {
        value: formatNumber(eiffelTowers.toFixed(1)),
        label: "Equivalent Eiffel Towers",
        icon: "resources/eiffele tower_bg.png",
      },
      {
        value: formatNumber(Math.ceil(eiffelTowers / representation.ratio)),
        label: "Visible Bottles",
        icon: "resources/plastic_bottle.png",
      },
      {
        value: yearsSince1950,
        label: "Years Since 1950",
      },
    ];

    stats.forEach((stat) => {
      const statDiv = statsContainer
        .append("div")
        .attr("class", "stat")
        .style("display", "flex")
        .style("align-items", "center")
        .style("gap", "10px")
        .style("padding", "10px")
        .style("border-bottom", "1px solid rgba(0,0,0,0.1)");

      if (stat.icon) {
        statDiv
          .append("img")
          .attr("src", stat.icon)
          .style("width", "20px")
          .style("height", "30px")
          .style("object-fit", "contain")
          .style("transition", "transform 0.3s ease")
          .on("mouseover", function () {
            d3.select(this).style("transform", "scale(1.2)");
          })
          .on("mouseout", function () {
            d3.select(this).style("transform", "scale(1)");
          });
      }
      const textContainer = statDiv.append("div").style("flex", "1");
      textContainer.append("div").attr("class", "value").text(stat.value);
      textContainer.append("div").attr("class", "label").text(stat.label);
    });

    d3.select("#info-panel").style("display", "block").style("opacity", 1);
  }
  function updateYearDisplay(year) {
    d3.select("#year-display").text(year).style("z-index", 0);
  }

  function generateBottlePositions(data) {
    const eiffelTowers = calculateEiffelTowers(
      data.CumulativePlasticProduction
    );
    const representation = calculateBottleRepresentation(
      data.Year,
      eiffelTowers
    );
    const bottleCount = Math.min(representation.bottleCount, 1000);
    const bottleSize = calculatebottlesize(eiffelTowers);
    const layout = calculatebottlelayout(width, height, bottleSize);

    const positions = [];
    const baseRowBottles = Math.ceil(Math.sqrt(bottleCount * 2));
    let bottlesPlaced = 0;
    let currentRow = 0;

    const baseY = height - margin.bottom - bottleSize.height;
    const verticalSpacing = bottleSize.height * 0.8;

    while (bottlesPlaced < bottleCount) {
      const bottlesInRow = Math.max(1, baseRowBottles - currentRow);
      const rowWidth = bottlesInRow * (bottleSize.width * 1.2);
      const rowStartX = (width - rowWidth) / 2;

      for (let i = 0; i < bottlesInRow && bottlesPlaced < bottleCount; i++) {
        const xPos = rowStartX + i * bottleSize.width * 1.2;
        const yPos = baseY - currentRow * verticalSpacing;
        const baseOpacity = representation.opacity;
        const rowOpacity =
          baseOpacity * (1 - (currentRow / baseRowBottles) * 0.2);
        positions.push({
          x: xPos,
          y: yPos,
          width: bottleSize.width,
          height: bottleSize.height,
          delay: bottlesPlaced * (50 / Math.sqrt(bottleCount)),
          opacity: rowOpacity,
          row: currentRow,
        });
        bottlesPlaced++;
      }
      currentRow++;
    }

    return positions;
  }

  function updateBottleVisualization(data) {
    const positions = generateBottlePositions(data);
    bottleChart.style("display", "block");
    const bottles = bottleChart.selectAll(".bottle").data(positions);

    bottles
      .enter()
      .append("image")
      .attr("class", "bottle")
      .attr("href", "resources/plastic_bottle.png")
      .attr("width", (d) => d.width)
      .attr("height", (d) => d.height)
      .attr("x", (d) => d.x)
      .attr("y", height)
      .style("opacity", 0)
      .transition()
      .duration(1000)
      .delay((d) => d.delay)
      .attr("y", (d) => d.y)
      .style("opacity", (d) => d.opacity)
      .ease(d3.easeBounceOut);

    // Update
    bottles
      .transition()
      .duration(1000)
      .attr("width", (d) => d.width)
      .attr("height", (d) => d.height)
      .attr("x", (d) => d.x)
      .attr("y", (d) => d.y)
      .style("opacity", (d) => d.opacity);
    bottles.exit().transition().duration(500).style("opacity", 0).remove();
  }

  function updateBarChart(data) {
    const chartWidth = width * 0.85;
    const chartHeight = height * 0.7;
    const chartX = (width - chartWidth) / 2;
    const chartY = (height - chartHeight) / 2;

    barChartContainer.attr("transform", `translate(${chartX},${chartY})`);
    const xPadding = (chartWidth - margin.left - margin.right) * 0.02;
    xScale
      .domain([1950, 2019])
      .range([margin.left + xPadding, chartWidth - margin.right - xPadding]);

    yScale
      .domain([1000000, d3.max(data, (d) => d.CumulativePlasticProduction)])
      .range([chartHeight - margin.bottom, margin.top]);
    barChart.selectAll(".chart-border").remove();
    const borders = barChart.append("g").attr("class", "chart-borders");
    borders
      .append("line")
      .attr("class", "chart-border")
      .attr("x1", margin.left)
      .attr("x2", margin.left)
      .attr("y1", margin.top)
      .attr("y2", chartHeight - margin.bottom)
      .style("stroke", "#666")
      .style("stroke-width", 2);
    borders
      .append("line")
      .attr("class", "chart-border")
      .attr("x1", chartWidth - margin.right)
      .attr("x2", chartWidth - margin.right)
      .attr("y1", margin.top)
      .attr("y2", chartHeight - margin.bottom)
      .style("stroke", "#666")
      .style("stroke-width", 2);
    borders
      .append("line")
      .attr("class", "chart-border")
      .attr("x1", margin.left)
      .attr("x2", chartWidth - margin.right)
      .attr("y1", margin.top)
      .attr("y2", margin.top)
      .style("stroke", "#666")
      .style("stroke-width", 2);
    borders
      .append("line")
      .attr("class", "chart-border")
      .attr("x1", margin.left)
      .attr("x2", chartWidth - margin.right)
      .attr("y1", chartHeight - margin.bottom)
      .attr("y2", chartHeight - margin.bottom)
      .style("stroke", "#666")
      .style("stroke-width", 2);

    xAxisGroup
      .attr("transform", `translate(0,${chartHeight - margin.bottom})`)
      .transition()
      .duration(1000)
      .call(xAxis)
      .call((g) => {
        g.selectAll(".tick text")
          .style("font-size", "12px")
          .style("font-weight", "bold")
          .attr("dy", "0.3em");
      });

    const yAxis = d3
      .axisLeft(yScale)
      .tickFormat((d) => {
        if (d >= 1000000000) {
          return `${(d / 1000000000).toFixed(1)}B`;
        } else if (d >= 1000000) {
          return `${(d / 1000000).toFixed(0)}M`;
        }
        return d;
      })
      .tickValues([1000000, 10000000, 50000000, 100000000, 500000000])
      .tickSize(-(chartWidth - margin.left - margin.right))
      .tickPadding(10);

    yAxisGroup
      .attr("transform", `translate(${margin.left},0)`)
      .transition()
      .duration(1000)
      .call(yAxis)
      .call((g) => {
        g.selectAll(".tick text")
          .style("font-size", "12px")
          .style("font-weight", "bold")
          .attr("dx", "-0.3em");
      });

    const barWidth =
      ((chartWidth - margin.left - margin.right - 2 * xPadding) / data.length) *
      0.95;
    const bars = barChart.selectAll(".bar").data(data);
    const redGradient = d3
      .scaleLinear()
      .domain([1950, 2019])
      .range(["#ffcdd2", "#880808"]);
    bars.exit().remove();
    bars
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => xScale(d.Year) - barWidth / 2)
      .attr("y", chartHeight - margin.bottom)
      .attr("width", barWidth)
      .attr("height", 0)
      .style("fill", (d) => redGradient(d.Year))
      .style("opacity", 0.8)
      .transition()
      .duration(100)
      .delay((d, i) => i * 50)
      .attr("y", (d) => yScale(d.CumulativePlasticProduction))
      .attr(
        "height",
        (d) =>
          chartHeight - margin.bottom - yScale(d.CumulativePlasticProduction)
      )
      .style("opacity", 0.8);

    bars
      .transition()
      .duration(100)
      .delay((d, i) => i * 50)
      .attr("x", (d) => xScale(d.Year) - barWidth / 2)
      .attr("y", (d) => yScale(d.CumulativePlasticProduction))
      .attr("width", barWidth)
      .attr(
        "height",
        (d) =>
          chartHeight - margin.bottom - yScale(d.CumulativePlasticProduction)
      )
      .style("fill", (d) => redGradient(d.Year));
  }

  function setBarChartState(active) {
    barchartactive = active;
    if (active) {
      barChartContainer.style("display", "block").style("opacity", 1);
      xAxisGroup.style("display", "block");
      yAxisGroup.style("display", "block");
      svg.selectAll(".x-label, .y-label").style("display", "block");
      updateBarChart(globaldata);
    }
  }

  function updateStage(index) {
    const duration = 1000;
    d3.select("#vis").transition().duration(duration);
    currentstage = index;
    const infoPanel = d3.select("#info-panel");
    const controls = d3.select("#controls");
    const yearDisplay = d3.select("#year-display");

    if (index >= 2 && index <= 5) {
      infoPanel.transition().duration(duration).style("opacity", 1);
      controls.transition().duration(duration).style("opacity", 1);
      yearDisplay.transition().duration(duration).style("opacity", 1);
    } else {
      infoPanel.transition().duration(duration).style("opacity", 0);
      controls.transition().duration(duration).style("opacity", 0);
      yearDisplay.transition().duration(duration).style("opacity", 0);
    }
    if (index !== 6) {
      barChartContainer
        .transition()
        .duration(duration)
        .style("opacity", 0)
        .on("end", () => {
          barChartContainer.style("display", "none");
          xAxisGroup.style("display", "none");
          yAxisGroup.style("display", "none");
          svg.selectAll(".x-label, .y-label").style("display", "none");
        });
    }

    switch (index) {
      case 1:
        eiffelTower.transition().duration(duration).style("opacity", 0);
        bottleChart.style("display", "none");
        yearDisplay.style("z-index", -1);
        break;

      case 2:
        const eiffelDimensions = calculateeiffeltowerdimensions();
        eiffelTower
          .attr("x", eiffelDimensions.x)
          .attr("y", eiffelDimensions.y)
          .attr("width", eiffelDimensions.width)
          .attr("height", eiffelDimensions.height)
          .transition()
          .duration(duration)
          .style("opacity", 1);
        bottleChart.style("display", "none");
        break;

      case 3:
        eiffelTower.transition().duration(duration).style("opacity", 0);
        bottleChart.style("display", "block");
        currentyearindex = 0;
        updateBottleVisualization(globaldata[0]);
        break;

      case 4:
        eiffelTower.style("opacity", 0);
        bottleChart.style("display", "block");
        break;

      case 5:
        eiffelTower.style("opacity", 0);
        bottleChart.style("display", "block");
        break;

      case 6: // bar chart
        bottleChart
          .selectAll(".bottle")
          .transition()
          .duration(duration)
          .style("opacity", 0)
          .remove();
        eiffelTower.transition().duration(duration).style("opacity", 0);
        yearDisplay.style("z-index", -1);
        setTimeout(() => {
          bottleChart.style("display", "none");
          setBarChartState(true);
        }, duration);
        break;
    }
    if (globaldata[currentyearindex] && index >= 2 && index <= 5) {
      updateInfoPanel(globaldata[currentyearindex]);
      updateYearDisplay(globaldata[currentyearindex].Year);
      yearDisplay.style("z-index", 0);
    }
  }

  const scroller = scrollama();

  scroller
    .setup({
      step: ".step",
      offset: 0.5,
      debug: false,
      progress: true,
    })
    .onStepEnter((response) => {
      const totalSteps = 6;

      if (response.index < totalSteps) {
        if (response.index + 1 === 6) {
          setBarChartState(true);
        }
        updateStage(response.index + 1);
      } else {
        setBarChartState(true);
      }
    })
    .onStepProgress((response) => {
      if (response.index === 3) {
        const progress = response.progress;
        const targetIndex = Math.min(
          Math.floor(progress * (globaldata.length - 1)),
          globaldata.length - 1
        );

        if (targetIndex !== currentyearindex) {
          currentyearindex = targetIndex;
          updateBottleVisualization(globaldata[currentyearindex]);
          updateInfoPanel(globaldata[currentyearindex]);
          updateYearDisplay(globaldata[currentyearindex].Year);
        }
      }
    });

  const resizeObserver = new ResizeObserver((entries) => {
    for (let entry of entries) {
      if (entry.target.id === "scroll-container") {
        scroller.resize();
      }
    }
  });
  resizeObserver.observe(document.getElementById("scroll-container"));
  const yearSelect = document.getElementById("year-select");
  yearSelect.addEventListener("change", (event) => {
    const year = parseInt(event.target.value);
    const index = globaldata.findIndex((d) => d.Year === year);
    if (index !== -1) {
      currentyearindex = index;
      updateBottleVisualization(globaldata[index]);
      updateInfoPanel(globaldata[index]);
      updateYearDisplay(year);
    }
  });
  const playPauseBtn = document.getElementById("play-pause");
  playPauseBtn.addEventListener("click", () => {
    isplaying = !isplaying;
    playPauseBtn.textContent = isplaying ? "Pause" : "Play";
    if (isplaying) {
      function step() {
        if (!isplaying) return;
        if (currentyearindex < globaldata.length - 1) {
          currentyearindex++;
          updateBottleVisualization(globaldata[currentyearindex]);
          updateInfoPanel(globaldata[currentyearindex]);
          updateYearDisplay(globaldata[currentyearindex].Year);
          setTimeout(step, 1000);
        } else {
          isplaying = false;
          playPauseBtn.textContent = "Play";
        }
      }
      step();
    }
  });
  const resetBtn = document.getElementById("reset");
  resetBtn.addEventListener("click", () => {
    currentyearindex = 0;
    isplaying = false;
    playPauseBtn.textContent = "Play";
    updateBottleVisualization(globaldata[0]);
    updateInfoPanel(globaldata[0]);
    updateYearDisplay(globaldata[0].Year);
  });

  d3.csv("imp/global-plastics-production.csv").then((data) => {
    globaldata = data
      .filter((d) => d.Entity === "World")
      .map((d) => {
        const year = +d.Year;
        const production =
          +d["Annual plastic production between 1950 and 2019"];
        return {
          Year: year,
          CumulativePlasticProduction: production,
          EiffelTowers: +(production / eiffeltowerplastic).toFixed(2),
        };
      })
      .sort((a, b) => a.Year - b.Year);

    globaldata.forEach((d) => {
      const option = document.createElement("option");
      option.value = d.Year;
      option.textContent = d.Year;
      yearSelect.appendChild(option);
    });

    updateStage(1);
  });
  window.addEventListener("resize", () => {
    if (barchartactive) {
      updateBarChart(globaldata);
    }
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;
    const newMargin = calculateresponsivemargins();

    svg.attr("width", newWidth).attr("height", newHeight);
    xScale.range([newMargin.left, newWidth - newMargin.right]);
    yScale.range([newHeight - newMargin.bottom, newMargin.top]);
    xAxisGroup.attr(
      "transform",
      `translate(0,${newHeight - newMargin.bottom})`
    );
    yAxisGroup.attr("transform", `translate(${newMargin.left},0)`);

    svg
      .select(".x-label")
      .attr("x", newWidth / 2)
      .attr("y", newHeight - newMargin.bottom + 25);

    svg
      .select(".y-label")
      .attr("x", -newHeight / 2)
      .attr("y", newMargin.left - 35);

    if (currentstage === 2) {
      const eiffelDimensions = calculateeiffeltowerdimensions();
      eiffelTower
        .attr("x", eiffelDimensions.x)
        .attr("y", eiffelDimensions.y)
        .attr("width", eiffelDimensions.width)
        .attr("height", eiffelDimensions.height);
    } else if (currentstage === 6) {
      updateBarChart(globaldata);
    } else if (currentstage >= 3) {
      updateBottleVisualization(globaldata[currentyearindex]);
    }
    scroller.resize();
  });
});
