// Set up the dimensions of the SVG
const margin = { top: 20, right: 30, bottom: 40, left: 150 };
const width = 1600;
const height = 1000;
const barWidth = 30;
const barPadding = 10;
const transitDuration = 500;
const interval = 250;
// Create the SVG container
const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const timeText = svg.append("text")
    .attr("class", "time-label")
    .attr("x", width / 2) // Center the time label horizontally
    .attr("y", margin.top / 2) // Position the text at the top
    .attr("text-anchor", "middle")
    .attr("font-size", "24px")
    .attr("fill", "black");

const times = [];
const filePath = "data/final/";
const files = [];
const bankCountData = {};
const bubbleScale = 0.6;
let colorScale;
let showTopN = 10;
let selectedMonth, selectedYear;
for (let year = 104; year <= 113; ++year) {
    for (let month = 1; month <= 12; ++month) {

        // handle missing data
        if (year == 112 && month == 2) continue;
        else if (year == 113 && month > 9) continue;

        let sy = year.toString();
        let sm = month.toString();
        if (month < 10) {
            sm = '0' + sm;
        }

        let filename = filePath + sy + sm + ".csv";
        times.push((1911 + year).toString() + "-" + sm);
        files.push(filename)
    }
}

const promises = files.map(fileName => {
    return d3.csv(fileName)
});
// Once all data is loaded, start the animation
Promise.all(promises).then((data) => {
    process_data(data);
    init();

    drawRuler();
    selectedYear = "2015";
    selectedMonth = "01";
    drawBubbleChart(selectedYear, selectedMonth);

});

function process_data(data) {
    let flag = true;
    data.forEach((element, index) => {
        let time = times[index];
        element.forEach(e => {

            let name = e.金融機構名稱;
            let count = e.當月發卡數;
            if (bankCountData[name] === undefined) {
                bankCountData[name] = {};
            }
            bankCountData[name][time] = count;
        });
        flag = false;
    });


    console.log("bankCountData:", bankCountData)
}

function init() {
    // Year dropdown
    const yearDropdown = d3.select("#year-select");
    const years = Array.from(new Set(times.map(t => t.split("-")[0]))); // Extract unique years
    yearDropdown.selectAll("option")
        .data(years)
        .enter()
        .append("option")
        .attr("value", d => d)
        .text(d => d);

    // Month dropdown
    const monthDropdown = d3.select("#month-select");
    const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, "0"));
    monthDropdown.selectAll("option")
        .data(months)
        .enter()
        .append("option")
        .attr("value", d => d)
        .text(d => d);

    // Add event listeners
    yearDropdown.on("change", () => handleSelectionChange());
    monthDropdown.on("change", () => handleSelectionChange());

    const topDropDown = d3.select("#top-select");
    let n = Object.entries(bankCountData).length;
    const tops = Array(n).fill().map((_, i) => i + 1).slice(2 - n);

    topDropDown.selectAll("option")
        .data(tops)
        .enter()
        .append("option")
        .attr("value", d => d)
        .text(d => d);

    topDropDown.on("change", ()=>{
        showTopN = parseInt(topDropDown.property("value"))
        drawBubbleChart(selectedYear, selectedMonth);
    })



}

// Handle dropdown selection changes
function handleSelectionChange() {
    selectedYear = d3.select("#year-select").property("value");
    selectedMonth = d3.select("#month-select").property("value");
    drawBubbleChart(selectedYear, selectedMonth);
}

function drawBubbleChart(year, month) {
    let time = `${selectedYear}-${selectedMonth}`
    console.log(`draw bubble ${time}`);

    const currentData = Object.entries(bankCountData).map(([bank, data]) => ({
        bank: bank,
        count: data[time] || 0
    })).sort((a, b) => b.count - a.count).slice(0, showTopN).reverse();

    let colorScale = d3.scaleOrdinal(["#B2EC5D", "#7CFC00", "#66FF00", "#ACE1AF", "#77DD77", "#93C572", "#85BB65", "#87A96B", "#03C03C", "#138808"])
        .domain(currentData.map((e) => e.count))

    // Clear previous bubbles and labels
    svg.selectAll(".bubble").remove();
    svg.selectAll(".label").remove();
    svg.selectAll(".center-point").remove();

    // Add bubbles
    const bubble = svg.selectAll(".bubble")
        .data(currentData)
        .enter()
        .append("circle")
        .attr("class", "bubble")
        .attr("r", d => Math.sqrt(d.count) * bubbleScale)
        .attr("fill", d => colorScale(d.count))
        .attr("stroke", "white")
        .attr("stroke-width", 1)
        .attr("cx", (d, i) => width / 2 + i * 50 - (currentData.length * 25))
        .attr("cy", height / 2)
        .attr("opacity", 0.5);

    const centerPoints = svg.selectAll(".center-point")
        .data(currentData)
        .enter()
        .append("circle")
        .attr("class", "center-point")
        .attr("r", 3)
        .attr("fill", "red")
        .attr("cx", (d, i) => width / 2 + i * 50 - (currentData.length * 25))
        .attr("cy", height / 2);

    // Add labels
    label = svg.selectAll(".label")
        .data(currentData)
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("x", (d, i) => width / 2 + i * 50 - (currentData.length * 25))
        .attr("y", height / 2)
        .attr("dy", "-1.75em")
        .attr("text-anchor", "middle")
        .text(d => d.bank)
        .attr("font-size", "12px")
        .attr("fill", "black");


    // Function to update positions on every tick
    function ticked() {
        bubble
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);

        label
            .attr("x", d => d.x)
            .attr("y", d => d.y);
        centerPoints
            .attr("cx", d => d.x)  // Update center point's x position
            .attr("cy", d => d.y); // Update center point's y position
    }

    const simulation = d3.forceSimulation(currentData)
        .force("x", d3.forceX(d => width / 2) // Pull everything toward the center horizontally
            .strength(d => bubbleScale / 20)) // Make larger bubbles stronger towards the center
        .force("y", d3.forceY(d => height / 2) // Pull everything toward the center vertically
            .strength(d => bubbleScale / 20)) // Make larger bubbles stronger towards the center
        .force("collide", d3.forceCollide(d => Math.sqrt(d.count) * bubbleScale * 1.05)) // Prevent overlap
        .on("tick", ticked); // Update positions on every tick

    bubble.on("mouseover", (event, d) => {
        d3.select(event.target).attr("stroke", "orange").attr("stroke-width", 2);
        tooltip.style("display", "block")
            .html(`Bank: ${d.bank}<br>Count: ${d.count}`)
            .style("left", `${event.pageX + 5}px`)
            .style("top", `${event.pageY + 5}px`)
            .attr("cx", width / 2).attr("cy", height / 2)
            ;
    })
        .on("mouseout", (event, d) => {
            d3.select(event.target).attr("stroke", "white").attr("stroke-width", 1);
            tooltip.style("display", "none");
        });

    bubble.call(d3.drag()
        .on("start", (event, d) => {
            simulation.alphaTarget(0.3).restart(); // Restart the simulation
        })
        .on("drag", (event, d) => {
            // Update the position of the dragged bubble
         
            d.x = event.x;
            d.y = event.y;
            ticked(); // Update positions immediately
        })
        .on("end", (event, d) => {

            simulation.alphaTarget(0); // Stop the simulation from running
        }));
    const tooltip = d3.select("#chart")
        .append("div")
        .style("width", "200px")
        .style("position", "absolute")
        .style("background", "lightgray")
        .style("padding", "5px")
        .style("border-radius", "5px")
        .style("display", "none");

}

function drawRuler() {

    const counts = [10000, 20000, 30000, 40000, 50000, 80000, 100000, 150000, 200000];

    counts.forEach((c) => {

        let r = Math.sqrt(c) * bubbleScale;

        svg.append("text")
            .attr("class", "concentric-circle-label")
            .attr("x", width / 2 + r)
            .attr("y", height / 2)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("fill", "black")
            .attr("dx", "-0.5em")
            .text(`${c / 10000}`);
        svg.append("circle")
            .attr("class", "concentric-circle")
            .attr("cx", width / 2)
            .attr("cy", height / 2)
            .attr("r", r)  // Radius increases with each iteration
            .attr("fill", "none")
            .attr("stroke", "#333333")
            .attr("stroke-width", 0.5);

    })

    svg.append("circle")
        .attr("class", "concentric-circle-center")
        .attr("r", 3)
        .attr("fill", "black")
        .attr("cx", width / 2)
        .attr("cy", height / 2);
    svg.append("text")
        .attr("class", "concentric-circle-label")
        .attr("x", width / 2 + (Math.sqrt(counts[counts.length - 1]) * bubbleScale) + 50)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("fill", "black")
        .attr("dx", "-0.5em")
        .text("單位:萬");
    // Draw concentric circles

    // Additional ruler drawing logic can go here if needed
}
