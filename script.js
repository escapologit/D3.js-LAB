// Set up global constants
const margin = { top: 50, right: 50, bottom: 50, left: 50 };
const width = 400 - margin.left - margin.right;
const height = 300 - margin.top - margin.bottom;

// Load data and initialize all visualizations
d3.csv("data.csv").then(data => {
    // Parse data
    data.forEach(d => {
        d.Year = +d.Year;
        d["Life expectancy"] = +d["Life expectancy"];
        d["Adult Mortality"] = +d["Adult Mortality"];
        d["infant deaths"] = +d["infant deaths"];
        d.Alcohol = +d.Alcohol;
        d["percentage expenditure"] = +d["percentage expenditure"];
        d["Hepatitis B"] = +d["Hepatitis B"];
        d.BMI = +d.BMI;
        d["under-five deaths"] = +d["under-five deaths"];
        d.Polio = +d.Polio;
        d["Total expenditure"] = +d["Total expenditure"];
        d.Diphtheria = +d.Diphtheria;
        d["HIV/AIDS"] = +d["HIV/AIDS"];
        d.GDP = +d.GDP;
        d.Population = +d.Population;
        d["thinness  1-19 years"] = +d["thinness  1-19 years"];
        d["thinness 5-9 years"] = +d["thinness 5-9 years"];
        d["Income composition of resources"] = +d["Income composition of resources"];
        d.Schooling = +d.Schooling;
    });

    // Filter out rows where Life expectancy is 0 or NaN
    data = data.filter(d => !isNaN(d["Life expectancy"]) && d["Life expectancy"] > 0);

    // Populate filters
    populateFilters(data);

    // Render all visualizations
    renderHeatmap(data, "#heatmap");
    renderScatter(data, "Life expectancy", "Alcohol", "#scatter");
    renderBubble(data, "#bubble");
    renderLineChart(data, "Year", "Life expectancy", "#line");
    renderBoxPlot(data, "Status", "Life expectancy", "#box");
    renderMap(data, "#map");


    // Set up filter event listeners
    setupFilterListeners(data);
});

function populateFilters(data) {
    // Extract unique countries and years
    const countries = Array.from(new Set(data.map(d => d.Country))).sort();
    const years = Array.from(new Set(data.map(d => d.Year))).sort((a, b) => a - b);

    // Populate country select
    const countrySelect = d3.select("#country-select");
    countries.forEach(country => {
        const label = countrySelect.append("label").attr("class", "checkbox-label");
        label.append("input")
            .attr("type", "checkbox")
            .attr("value", country)
            .attr("class", "country-checkbox");
        label.append("span").text(country);
    });

    // Populate year select
    const yearSelect = d3.select("#year-select");
    years.forEach(year => {
        const label = yearSelect.append("label").attr("class", "checkbox-label");
        label.append("input")
            .attr("type", "checkbox")
            .attr("value", year)
            .attr("class", "year-checkbox");
        label.append("span").text(year);
    });

    // Adjust scrollbar height
    countrySelect.style("height", "100px").style("overflow-y", "auto");
    yearSelect.style("height", "100px").style("overflow-y", "auto");
}

// Add event listeners for select all, deselect all, and search
document.getElementById("select-all-countries").addEventListener("click", () => {
    d3.selectAll(".country-checkbox").property("checked", true);
    applyFilters(data);
});

document.getElementById("deselect-all-countries").addEventListener("click", () => {
    d3.selectAll(".country-checkbox").property("checked", false);
    applyFilters(data);
});

document.getElementById("country-search").addEventListener("input", (event) => {
    const searchTerm = event.target.value.toLowerCase();
    d3.selectAll(".checkbox-label").style("display", function() {
        const label = d3.select(this).text().toLowerCase();
        return label.includes(searchTerm) ? "block" : "none";
    });
});

function setupFilterListeners(data) {
    const countryCheckboxes = d3.selectAll(".country-checkbox");
    const yearCheckboxes = d3.selectAll(".year-checkbox");

    countryCheckboxes.on("change", () => applyFilters(data));
    yearCheckboxes.on("change", () => applyFilters(data));
}

function applyFilters(data) {
    // Get selected values
    const selectedCountries = Array.from(d3.selectAll(".country-checkbox:checked").nodes()).map(node => node.value);
    const selectedYears = Array.from(d3.selectAll(".year-checkbox:checked").nodes()).map(node => +node.value);

    // Filter data based on selections
    let filteredData = data;
    if (selectedCountries.length > 0) {
        filteredData = filteredData.filter(d => selectedCountries.includes(d.Country));
    }
    if (selectedYears.length > 0) {
        filteredData = filteredData.filter(d => selectedYears.includes(d.Year));
    }

    // Update visualizations
    d3.select("#heatmap").selectAll("*").remove();
    d3.select("#scatter").selectAll("*").remove();
    d3.select("#bubble").selectAll("*").remove();
    d3.select("#line").selectAll("*").remove();
    d3.select("#box").selectAll("*").remove();
    d3.select("#map").selectAll("*").remove();

    renderHeatmap(filteredData, "#heatmap");
    renderScatter(filteredData, "Life expectancy", "Alcohol", "#scatter");
    renderBubble(filteredData, "#bubble");
    renderLineChart(filteredData, "Year", "Life expectancy", "#line");
    renderBoxPlot(filteredData, "Status", "Life expectancy", "#box");
    renderMap(filteredData, "#map");

}


// Heatmap
function renderHeatmap(data, containerId) {
    const margin = { top: 50, right: 100, bottom: 50, left: 50 }; // Increase right margin for the legend
    const width = 400//400 - margin.left - margin.right;
    const height = 400//400 - margin.top - margin.bottom;

    const chart = d3.select(containerId).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const keys = ["Life expectancy", "Adult Mortality", "Alcohol", "BMI", "Schooling", "GDP"];
    const correlations = calculateCorrelations(data, keys);

    const xScale = d3.scaleBand().domain(keys).range([0, width]).padding(0.1);
    const yScale = d3.scaleBand().domain(keys).range([0, height]).padding(0.1);
    const colorScale = d3.scaleSequential(d3.interpolateRdBu).domain([-1, 1]);

    // Create the heatmap cells
    chart.selectAll(".cell")
        .data(correlations)
        .enter()
        .append("rect")
        .attr("x", d => xScale(d.x))
        .attr("y", d => yScale(d.y))
        .attr("width", xScale.bandwidth())
        .attr("height", yScale.bandwidth())
        .attr("fill", d => colorScale(d.value));

    // Add the correlation values inside the heatmap cells
    chart.selectAll(".text")
        .data(correlations)
        .enter()
        .append("text")
        .attr("x", d => xScale(d.x) + xScale.bandwidth() / 2)
        .attr("y", d => yScale(d.y) + yScale.bandwidth() / 2)
        .attr("dy", ".35em") // Center the text vertically
        .attr("text-anchor", "middle")
        .text(d => d.value.toFixed(2));

    // Add X axis with rotated labels
    chart.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .style("text-anchor", "middle")
        .attr("transform", "rotate(-45)");

    // Add Y axis with rotated labels
    chart.append("g")
        .call(d3.axisLeft(yScale))
        .selectAll("text")
        .style("text-anchor", "middle")
        .attr("transform", "rotate(-45)");

    // Add the color scale legend on the right side
    const legendHeight = height;
    const legendWidth = 20;

    const legend = chart.append("g")
        .attr("transform", `translate(${width + 30}, 0)`);

    const legendScale = d3.scaleLinear().domain([-1, 1]).range([legendHeight, 0]);

    legend.selectAll("rect")
        .data(d3.range(-1, 1.1, 0.1))
        .enter()
        .append("rect")
        .attr("x", 0)
        .attr("y", d => legendScale(d))
        .attr("width", legendWidth)
        .attr("height", legendHeight / 11)
        .attr("fill", d => colorScale(d));

    // Add axis for the color scale legend
    const legendAxis = d3.axisRight(legendScale).ticks(3).tickFormat(d3.format(".1f"));

    legend.append("g")
        .attr("transform", `translate(${legendWidth}, 0)`)
        .call(legendAxis);

    // Add a label for the color scale
    legend.append("text")
        .attr("x", legendWidth / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle");
}

// Scatter Plot
function renderScatter(data, xKey, yKey, containerId) {
    // Set up margins, width, and height (increased margins for labels)
    const margin = { top: 20, right: 20, bottom: 100, left: 100 };
    const width = 960 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    // Set up color scale for Developed and Developing countries based on the 'Status' field
    const colorScale = d3.scaleOrdinal()
        .domain(["Developed", "Developing"])
        .range(["#1f77b4", "#ff7f0e"]);

    // Append SVG element to container
    const chart = d3.select(containerId).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Create Scales
    const xScale = d3.scaleLinear().domain(d3.extent(data, d => d[xKey])).range([0, width]);
    const yScale = d3.scaleLinear().domain(d3.extent(data, d => d[yKey])).range([height, 0]);

    // Create tooltip div and hide it initially
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background-color", "rgba(0, 0, 0, 0.7)")
        .style("color", "#fff")
        .style("padding", "5px")
        .style("border-radius", "4px")
        .style("font-size", "12px")
        .style("pointer-events", "none")
        .style("z-index", 9999);

    // Plotting the circles (dots)
    chart.selectAll(".dot")
        .data(data)
        .enter().append("circle")
        .attr("cx", d => xScale(d[xKey]))
        .attr("cy", d => yScale(d[yKey]))
        .attr("r", 5)
        .attr("fill", d => colorScale(d.Status))
        .on("mouseover", function(event, d) {
            tooltip.style("visibility", "visible")
                .html(`<strong>Country:</strong> ${d.Country}<br><strong>${xKey}:</strong> ${d[xKey]}<br><strong>${yKey}:</strong> ${d[yKey]}`);
            d3.select(this).attr("fill", "yellow");
        })
        .on("mousemove", function(event) {
            tooltip.style("top", (event.pageY + 5) + "px")
                .style("left", (event.pageX + 5) + "px");
        })
        .on("mouseout", function() {
            tooltip.style("visibility", "hidden");
            d3.select(this).attr("fill", d => colorScale(d.Status));
        });

    // Adding X axis
    const xAxis = chart.append("g")
        .call(d3.axisBottom(xScale))
        .attr("transform", `translate(0, ${height})`);

    // Adding Y axis
    const yAxis = chart.append("g")
        .call(d3.axisLeft(yScale));

    // Add X axis label
chart.append("text")
.attr("x", width / 2)
.attr("y", height + margin.bottom - 50)
.attr("text-anchor", "middle")
.text(xKey);

// Add Y axis label
chart.append("text")
.attr("x", -margin.left-50)
.attr("y", -margin.left/2)
.attr("text-anchor", "middle")
.attr("transform", "rotate(-90)")
.text(yKey);

    // Adding legend
    const legend = chart.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${width - 150}, 20)`); // Adjust the position of the legend

    // Add legend title
    legend.append("text")
        .attr("x", +50)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .attr("font-weight", "bold")
        .text("Country Status");

    // Legend for Developed and Developing countries
legend.selectAll(".legend-item")
.data(colorScale.domain())
.enter().append("g")
.attr("class", "legend-item")
.attr("transform", (d, i) => `translate(0, ${i * 25})`); // Spacing out the items

legend.selectAll(".legend-item")
.append("rect")
.attr("x", 0)
.attr("y", 0)
.attr("width", 20)
.attr("height", 20)
.attr("fill", colorScale);

legend.selectAll(".legend-item")
.append("text")
.attr("x", 30) // Position the text next to the color box
.attr("y", 15) // Align text vertically with color box
.attr("dy", ".35em") // Vertical alignment of text
.text(d => d); // Display the category name
}

// Bubble Chart
function renderBubble(data, containerId) {
    const margin = { top: 50, right: 30, bottom: 50, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const chart = d3.select(containerId).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const xKey = "GDP";
    const yKey = "Life expectancy";
    const sizeKey = "Population";
    const statusKey = "Status"; // The new key for development status

    // Define scales
    const xScale = d3.scaleLinear().domain(d3.extent(data, d => d[xKey])).range([0, width]);
    const yScale = d3.scaleLinear().domain(d3.extent(data, d => d[yKey])).range([height, 0]);

    // Bubble size scale (based on population)
    const sizeScale = d3.scaleSqrt().domain(d3.extent(data, d => d[sizeKey])).range([5, 40]); // Adjust range if necessary

    // Color scale for developed vs developing countries
    const colorScale = d3.scaleOrdinal()
        .domain(["Developed", "Developing"])
        .range(["#1f77b4", "#ff7f0e"]); // Blue for Developed, Orange for Developing (adjust colors as needed)

    // Create a tooltip div
    const tooltip = d3.select(containerId).append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background-color", "rgba(0, 0, 0, 0.7)")
        .style("color", "#fff")
        .style("padding", "10px")
        .style("border-radius", "5px")
        .style("pointer-events", "none");

    // Create the bubbles based on the data
    chart.selectAll(".bubble")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", d => xScale(d[xKey]))
        .attr("cy", d => yScale(d[yKey]))
        .attr("r", d => sizeScale(d[sizeKey])) // Bubble size based on population
        .attr("fill", d => colorScale(d[statusKey])) // Color based on development status
        .attr("opacity", 0.7)
        .on("mouseover", function(event, d) {
            tooltip.style("visibility", "visible")
                .html(`
                    <strong>Country:</strong> ${d.Country}<br>
                    <strong>GDP:</strong> ${d[xKey]}<br>
                    <strong>Life Expectancy:</strong> ${d[yKey]}<br>
                    <strong>Population:</strong> ${d[sizeKey]}<br>
                    <strong>Status:</strong> ${d[statusKey]}
                `);
        })
        .on("mousemove", function(event) {
            tooltip.style("top", (event.pageY + 5) + "px")
                .style("left", (event.pageX + 5) + "px");
        })
        .on("mouseout", function() {
            tooltip.style("visibility", "hidden");
        });

    // Add X axis with label
    chart.append("g").call(d3.axisBottom(xScale))
        .attr("transform", `translate(0, ${height})`)
        .append("text")
        .attr("x", width / 2)
        .attr("y", margin.bottom - 10)
        .style("text-anchor", "middle")
        .style("font-size", "14px");

    // Add Y axis with label
    chart.append("g").call(d3.axisLeft(yScale))
        .append("text")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 20)
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .style("transform", "rotate(-90deg)");

    // Add X axis label
    chart.append("text")
    .attr("x", width / 2)
    .attr("y", height + margin.bottom)
    .attr("text-anchor", "middle")
    .text("GDP");

    // Add Y axis label
    chart.append("text")
    .attr("x", -height / 2)
    .attr("y", -margin.left/2)
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .text("Life expectancy");

    // Adding legend
    const legend = chart.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${width - 150}, 170)`); // Adjust the position of the legend


    // Add legend title
    legend.append("text")
        .attr("x", +50)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .attr("font-weight", "bold")
        .text("Country Status");

    // Legend for Developed and Developing countries
legend.selectAll(".legend-item")
.data(colorScale.domain())
.enter().append("g")
.attr("class", "legend-item")
.attr("transform", (d, i) => `translate(0, ${i * 25})`); // Spacing out the items

legend.selectAll(".legend-item")
.append("rect")
.attr("x", 0)
.attr("y", 0)
.attr("width", 20)
.attr("height", 20)
.attr("fill", colorScale);

legend.selectAll(".legend-item")
.append("text")
.attr("x", 30) // Position the text next to the color box
.attr("y", 15) // Align text vertically with color box
.attr("dy", ".35em") // Vertical alignment of text
.text(d => d); // Display the category name
}

// Line Chart
function renderLineChart(data, xKey, yKey, containerId) {
    // Define margins and dimensions
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const width = 700 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Create the SVG container
    const svg = d3.select(containerId).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    const chart = svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Create scales
    const xScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d[xKey]))
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d[yKey]))
        .range([height, 0]);

    // Add axes
    chart.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale));

    chart.append("g")
        .call(d3.axisLeft(yScale));

    // Create a line generator
    const line = d3.line()
        .x(d => xScale(d[xKey]))
        .y(d => yScale(d[yKey]));

    // Nest data by country
    const nestedData = d3.group(data, d => d.Country);

    // Define a color scale
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // Add lines for each country
    nestedData.forEach((values, key) => {
        chart.append("path")
            .datum(values)
            .attr("fill", "none")
            .attr("stroke", color(key))
            .attr("stroke-width", 1.5)
            .attr("d", line)
            .attr("class", "line")
            .on("mouseover", function() {
                d3.select(this).attr("stroke-width", 3);
            })
            .on("mouseout", function() {
                d3.select(this).attr("stroke-width", 1.5);
            });
    });

    // Create a tooltip
    const tooltip = d3.select(containerId).append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background", "rgba(255, 255, 255, 0.8)")
        .style("padding", "8px")
        .style("border", "1px solid #ccc")
        .style("border-radius", "4px")
        .style("pointer-events", "none")
        .style("visibility", "hidden");

    // Add circles for points with tooltips
    nestedData.forEach((values, key) => {
        chart.selectAll(`.point-${key}`)
            .data(values)
            .enter()
            .append("circle")
            .attr("cx", d => xScale(d[xKey]))
            .attr("cy", d => yScale(d[yKey]))
            .attr("r", 4)
            .attr("fill", color(key))
            .on("mouseover", (event, d) => {
                tooltip.style("visibility", "visible")
                    .html(`<strong>Country:</strong> ${d.Country}<br><strong>${xKey}:</strong> ${d[xKey]}<br><strong>${yKey}:</strong> ${d[yKey]}`)
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 20}px`);
            })
            .on("mousemove", (event) => {
                tooltip.style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 20}px`);
            })
            .on("mouseout", () => {
                tooltip.style("visibility", "hidden");
            });
    });

    // Add labels to axes
    svg.append("text")
        .attr("transform", `translate(${margin.left + width / 2}, ${height + margin.top + 35})`)
        .style("text-anchor", "middle")
        .text(xKey);

    svg.append("text")
        .attr("transform", `translate(${margin.left - 40}, ${margin.top + height / 2}) rotate(-90)`)
        .style("text-anchor", "middle")
        .text(yKey);
}

// Box Plot
function renderBoxPlot(data, categoryKey, valueKey, containerId) {
    // Define margins and dimensions
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Create the SVG container
    const svg = d3.select(containerId).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    const chart = svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Create scales
    const categories = Array.from(new Set(data.map(d => d[categoryKey])));
    const xScale = d3.scaleBand().domain(categories).range([0, width]).padding(0.1);
    const yScale = d3.scaleLinear().domain(d3.extent(data, d => d[valueKey])).nice().range([height, 0]);

    // Group data by category
    const groupedData = d3.group(data, d => d[categoryKey]);

    // Create a tooltip
    const tooltip = d3.select(containerId).append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background", "rgba(255, 255, 255, 0.9)")
        .style("padding", "8px")
        .style("border", "1px solid #ccc")
        .style("border-radius", "4px")
        .style("pointer-events", "none")
        .style("visibility", "hidden");

    // Render each box plot
    groupedData.forEach((values, category) => {
        const sortedValues = values.map(d => d[valueKey]).sort(d3.ascending);
        const q1 = d3.quantile(sortedValues, 0.25);
        const median = d3.quantile(sortedValues, 0.5);
        const q3 = d3.quantile(sortedValues, 0.75);
        const min = d3.min(sortedValues);
        const max = d3.max(sortedValues);
        const x = xScale(category);

        // Box
        chart.append("rect")
            .attr("x", x)
            .attr("y", yScale(q3))
            .attr("width", xScale.bandwidth())
            .attr("height", yScale(q1) - yScale(q3))
            .attr("fill", "lightblue")
            .on("mouseover", (event) => {
                tooltip.style("visibility", "visible")
                    .html(`<strong>Category:</strong> ${category}<br>
                           <strong>Q1:</strong> ${q1}<br>
                           <strong>Median:</strong> ${median}<br>
                           <strong>Q3:</strong> ${q3}<br>
                           <strong>Min:</strong> ${min}<br>
                           <strong>Max:</strong> ${max}`)
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 20}px`);
            })
            .on("mousemove", (event) => {
                tooltip.style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 20}px`);
            })
            .on("mouseout", () => {
                tooltip.style("visibility", "hidden");
            });

        // Median line
        chart.append("line")
            .attr("x1", x)
            .attr("x2", x + xScale.bandwidth())
            .attr("y1", yScale(median))
            .attr("y2", yScale(median))
            .attr("stroke", "black")
            .attr("stroke-width", 1.5);

        // Whiskers
        chart.append("line")
            .attr("x1", x + xScale.bandwidth() / 2)
            .attr("x2", x + xScale.bandwidth() / 2)
            .attr("y1", yScale(max))
            .attr("y2", yScale(q3))
            .attr("stroke", "black")
            .attr("stroke-width", 1);

        chart.append("line")
            .attr("x1", x + xScale.bandwidth() / 2)
            .attr("x2", x + xScale.bandwidth() / 2)
            .attr("y1", yScale(min))
            .attr("y2", yScale(q1))
            .attr("stroke", "black")
            .attr("stroke-width", 1);

        // Whisker caps
        chart.append("line")
            .attr("x1", x + xScale.bandwidth() / 4)
            .attr("x2", x + xScale.bandwidth() * 3 / 4)
            .attr("y1", yScale(max))
            .attr("y2", yScale(max))
            .attr("stroke", "black")
            .attr("stroke-width", 1);

        chart.append("line")
            .attr("x1", x + xScale.bandwidth() / 4)
            .attr("x2", x + xScale.bandwidth() * 3 / 4)
            .attr("y1", yScale(min))
            .attr("y2", yScale(min))
            .attr("stroke", "black")
            .attr("stroke-width", 1);
    });

    // Add axes
    chart.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale));

    chart.append("g")
        .call(d3.axisLeft(yScale));

    // Add axis labels
    svg.append("text")
        .attr("transform", `translate(${margin.left + width / 2}, ${height + margin.top + 35})`)
        .style("text-anchor", "middle")
        .text(categoryKey);

    svg.append("text")
        .attr("transform", `translate(${margin.left - 40}, ${margin.top + height / 2}) rotate(-90)`)
        .style("text-anchor", "middle")
        .text(valueKey);
}

function renderMap(data, containerId) {
    const width = 800;
    const height = 400;

    const svg = d3.select(containerId).append("svg")
        .attr("width", width)
        .attr("height", height);

    const projection = d3.geoNaturalEarth1()
        .scale(150)
        .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    const colorScale = d3.scaleSequential(d3.interpolateBlues)
        .domain(d3.extent(data, d => d["Life expectancy"]));

    // Load GeoJSON data for the map
    d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson").then(world => {
        const countries = world.features;

        // Merge life expectancy data with GeoJSON
        countries.forEach(country => {
            const countryData = data.find(d => d.Country === country.properties.name);
            country.properties.lifeExpectancy = countryData ? countryData["Life expectancy"] : null;
        });

        // Create a tooltip div (single instance, outside of hover events)
        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("background-color", "rgba(0, 0, 0, 0.7)")
            .style("color", "#fff")
            .style("padding", "10px")
            .style("border-radius", "5px")
            .style("pointer-events", "none")
            .style("visibility", "hidden");

        // Draw the map
        svg.selectAll("path")
            .data(countries)
            .enter()
            .append("path")
            .attr("d", path)
            .attr("fill", d => {
                const value = d.properties.lifeExpectancy;
                return value ? colorScale(value) : "#ccc";
            })
            .attr("stroke", "#333")
            .on("mouseover", function (event, d) {
                // Show tooltip on hover
                tooltip.style("visibility", "visible")
                    .html(`
                        <strong>${d.properties.name}</strong><br>
                        Life Expectancy: ${d.properties.lifeExpectancy ? d.properties.lifeExpectancy.toFixed(2) : "N/A"}
                    `);
                d3.select(this).attr("stroke", "yellow").attr("stroke-width", 2);
            })
            .on("mousemove", function (event) {
                // Update tooltip position
                tooltip.style("top", `${event.pageY + 10}px`)
                    .style("left", `${event.pageX + 10}px`);
            })
            .on("mouseout", function () {
                // Hide tooltip when mouse leaves the country
                tooltip.style("visibility", "hidden");
                d3.select(this).attr("stroke", "#333").attr("stroke-width", 1);
            });

        // Add a legend
        const legendWidth = 300;
        const legendHeight = 10;

        const legend = svg.append("g")
            .attr("transform", `translate(${width - legendWidth - 20}, ${height - 40})`);

        const legendScale = d3.scaleLinear()
            .domain(colorScale.domain())
            .range([0, legendWidth]);

        legend.append("g")
            .call(d3.axisBottom(legendScale).ticks(5))
            .select(".domain").remove();

        legend.selectAll("rect")
            .data(d3.range(colorScale.domain()[0], colorScale.domain()[1], (colorScale.domain()[1] - colorScale.domain()[0]) / legendWidth))
            .enter()
            .append("rect")
            .attr("x", (d, i) => legendScale(d))
            .attr("y", 0)
            .attr("width", legendWidth / 100)
            .attr("height", legendHeight)
            .attr("fill", d => colorScale(d));
    });
}



// Helper Functions
function calculateCorrelations(data, keys) {
    const result = [];
    keys.forEach((x, i) => {
        keys.forEach((y, j) => {
            if (i <= j) {
                const correlationValue = pearsonCorrelation(
                    data.map(d => d[x]),
                    data.map(d => d[y])
                );
                result.push({ x, y, value: correlationValue });
            }
        });
    });
    return result;
}

function pearsonCorrelation(x, y) {
    const n = x.length;
    const meanX = d3.mean(x);
    const meanY = d3.mean(y);
    const numerator = d3.sum(x.map((xi, i) => (xi - meanX) * (y[i] - meanY)));
    const denominator = Math.sqrt(
        d3.sum(x.map(xi => (xi - meanX) ** 2)) * d3.sum(y.map(yi => (yi - meanY) ** 2))
    );
    return denominator === 0 ? 0 : numerator / denominator;
}