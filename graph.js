
// Set up the dimensions of the SVG
const margin = { top: 20, right: 30, bottom: 40, left: 150 };
const width = 1600 - margin.left - margin.right;
const height = 800 - margin.top - margin.bottom;
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
const cumulativeData = {};


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
    drawBubbleChart(times[0])
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
            if (flag) {
                cumulativeData[name] = 0;
            }
        });
        flag = false;
    });
    console.log("bankCountData:", bankCountData)
}

// Time Selector
const years = [...Array(10).keys()].map(i => 104 + i);
const months = [...Array(12).keys()].map(i => i + 1);
let selectedYear = years[0];
let selectedMonth = months[0];

const yearBlock = d3.select("#controls")
    .append("div")
    .attr("class", "year-block");

yearBlock.selectAll("div")
    .data(years)
    .enter()
    .append("div")
    .attr("class", d => `year-cell${d}`)
    .text(d => d)
    .on("click", d => {
        selectedYear = d;
        updateChart();
    });

const monthBlock = d3.select("#controls")
    .append("div")
    .attr("class", "month-block");

monthBlock.selectAll("div")
    .data(months)
    .enter()
    .append("div")
    .attr("class", d => `month-cell${d}`)
    .text(d => d)
    .on("click", d => {
        selectedMonth = d;
        updateChart();
    });

function updateChart() {
    const time = `${selectedYear}-${selectedMonth.toString().padStart(2, "0")}`;
    drawBubbleChart(time);
}

updateChart();


function drawBubbleChart(time) {

    console.log(`draw bubble ${time}`);
    const currentData = Object.entries(bankCountData).map(([bank, data]) => ({
        bank: bank,
        count: data[time] || 0
    }));

    currentData.sort((e1, e2) => {
        return e2.count - e1.count
    })

    slicedData = currentData.slice(0, 10)
    // Set up the Directed Force layout
    const simulation = d3.forceSimulation(slicedData)
        .force("x", d3.forceX(d => width / 2) // Pull everything toward the center horizontally
            .strength(d => 0.3)) // Make larger bubbles stronger towards the center
        .force("y", d3.forceY(d => height / 2) // Pull everything toward the center vertically
            .strength(d => 0.3)) // Make larger bubbles stronger towards the center
        .force("collide", d3.forceCollide(d => Math.sqrt(d.count) * 0.4)) // Prevent overlap
        .on("tick", ticked); // Update positions on every tick

    // Add the bubbles (circle elements)
    const bubble = svg.selectAll(".bubble")
        .data(slicedData)
        .enter().append("circle")
        .attr("class", "bubble")
        .attr("r", d => Math.sqrt(d.count) * 0.3) // Scale the radius based on the count
        .attr("stroke", "white")
        .attr("stroke-width", 1);

    // Add the labels for each bank
    const label = svg.selectAll(".label")
        .data(slicedData)
        .enter().append("text")
        .attr("class", "label")
        .attr("x", d => d.x)
        .attr("y", d => d.y)
        .attr("dy", ".35em")
        .attr("text-anchor", "middle")
        .text(d => d.bank)
        .attr("font-size", "12px")
        .attr("fill", "black");

    const color = d3.scaleSequential(["white", "green"])
        .domain([0, d3.max(slicedData, d => d.count)])

    bubble.attr("fill", d => color(d.count));
    // Function to update positions on every tick
    function ticked() {
        bubble
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);

        label
            .attr("x", d => d.x)
            .attr("y", d => d.y);
    }

    bubble.on("mouseover", (event, d) => {
        d3.select(event.target).attr("stroke", "orange").attr("stroke-width", 2);
        tooltip.style("display", "block")
            .html(`Bank: ${d.bank}<br>Count: ${d.count}`)
            .style("left", `${event.pageX + 5}px`)
            .style("top", `${event.pageY + 5}px`);
    })
        .on("mouseout", (event, d) => {
            d3.select(event.target).attr("stroke", "white").attr("stroke-width", 1);
            tooltip.style("display", "none");
        });

    const tooltip = d3.select("#chart")
        .append("div")
        .style("position", "absolute")
        .style("background", "lightgray")
        .style("padding", "5px")
        .style("border-radius", "5px")
        .style("display", "none");

}

